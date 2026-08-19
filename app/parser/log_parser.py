import json
from collections import defaultdict
from app.models.request_record import RequestRecord


class LogParser:
    """
    Parses raw event logs from Better Stack API and converts them into
    RequestRecord objects with robust format normalization and filtering.
    """

    def __init__(self, log_file: str):
        self.log_file = log_file

    def parse(self, log_level: str = "ALL", query: str = ""):
        """
        Reads the JSON log file and returns a list of RequestRecord objects.
        Supports log_level filtering ('ALL', 'ERROR', 'SUCCESS', 'WARN') and query filtering.
        """
        try:
            with open(self.log_file, "r") as file:
                raw_data = json.load(file)
        except Exception:
            return []

        if not raw_data:
            return []

        # Extract event list if wrapped inside a parent dictionary
        events = []
        if isinstance(raw_data, list):
            events = raw_data
        elif isinstance(raw_data, dict):
            if "data" in raw_data and isinstance(raw_data["data"], list):
                events = raw_data["data"]
            elif "logs" in raw_data and isinstance(raw_data["logs"], list):
                events = raw_data["logs"]
            elif "entries" in raw_data and isinstance(raw_data["entries"], list):
                events = raw_data["entries"]
            else:
                events = [raw_data]
        else:
            events = [{"message": str(raw_data)}]

        grouped_events = defaultdict(list)

        # Normalize each event into a structured dictionary
        for idx, item in enumerate(events):
            event = {}
            if isinstance(item, dict):
                event = dict(item)
                if "attributes" in item and isinstance(item["attributes"], dict):
                    event.update(item["attributes"])
                elif "json" in item and isinstance(item["json"], dict):
                    event.update(item["json"])
                elif "data" in item and isinstance(item["data"], dict):
                    event.update(item["data"])
                elif "message" in item and isinstance(item["message"], str) and item["message"].startswith("{"):
                    try:
                        parsed_msg = json.loads(item["message"])
                        if isinstance(parsed_msg, dict):
                            event.update(parsed_msg)
                    except Exception:
                        pass
            elif isinstance(item, str):
                try:
                    parsed_item = json.loads(item)
                    if isinstance(parsed_item, dict):
                        event = parsed_item
                    else:
                        event = {"message": item}
                except Exception:
                    event = {"message": item}
            else:
                event = {"message": str(item)}

            if not isinstance(event, dict):
                event = {"message": str(event)}

            req_id = event.get("request_id") or event.get("trace_id") or event.get("id") or f"REQ_{idx+1:03d}"
            grouped_events[str(req_id)].append(event)

        records = []

        for request_id, request_events in grouped_events.items():

            record = RequestRecord(
                trace_id="",
                request_id=request_id,
                timestamp="",
                agent_name="",
                prompt=""
            )

            for event in request_events:
                if not isinstance(event, dict):
                    continue

                if "trace_id" in event:
                    record.trace_id = str(event["trace_id"])
                elif not record.trace_id:
                    record.trace_id = f"TRACE_{request_id}"

                if "timestamp" in event:
                    record.timestamp = str(event["timestamp"])
                elif "dt" in event:
                    record.timestamp = str(event["dt"])

                if "agent_name" in event:
                    record.agent_name = str(event["agent_name"])
                elif "name" in event:
                    record.agent_name = str(event["name"])

                if "prompt" in event:
                    record.prompt = str(event["prompt"])

                # Capture selected tools
                if event.get("event_type") == "TOOL_SELECTED" or "tool_name" in event:
                    tool_name = event.get("tool_name") or event.get("tool")
                    if tool_name and tool_name not in record.tool_calls:
                        record.tool_calls.append(str(tool_name))

                # Count retries
                if event.get("event_type") == "RETRY" or "retries" in event:
                    try:
                        retries = int(event.get("retries", 1))
                        record.retries = max(record.retries, retries)
                    except Exception:
                        record.retries += 1

                # Capture actual response generated by the agent
                if event.get("event_type") == "AGENT_RESPONSE" or "actual_result" in event:
                    record.actual_result = event.get("actual_result") or event.get("response")

                # Capture final request status
                if event.get("event_type") == "REQUEST_COMPLETED" or "status" in event:
                    record.status = str(event.get("status", "UNKNOWN"))
                    try:
                        record.latency_ms = float(event.get("latency_ms", record.latency_ms or 0))
                    except Exception:
                        record.latency_ms = 0.0
                    record.error = event.get("error")

                # If raw log row has direct status or level
                if not record.status or record.status == "UNKNOWN":
                    level = str(event.get("level", "")).lower()
                    if level in ["error", "fatal", "critical"]:
                        record.status = "FAILED"
                        record.error = event.get("message") or "Error logged in Better Stack"
                    elif level in ["info", "debug", "success", "ok"]:
                        record.status = "SUCCESS"

            # Set sensible defaults if fields were omitted in raw log
            if not record.trace_id:
                record.trace_id = f"TRACE_{request_id}"
            if not record.agent_name:
                record.agent_name = "MemoraeAgent"
            if not record.tool_calls:
                record.tool_calls = ["Memorae Core Tool"]

            # Filter by log_level if specified
            if log_level == "ERROR" and record.status != "FAILED":
                continue
            if log_level in ["SUCCESS", "INFO"] and record.status != "SUCCESS":
                continue

            # Filter by keyword query if specified
            if query and query.strip():
                q = query.strip().lower()
                matches = (
                    q in record.request_id.lower()
                    or q in record.trace_id.lower()
                    or q in record.agent_name.lower()
                    or q in record.prompt.lower()
                    or any(q in t.lower() for t in record.tool_calls)
                    or (record.error and q in str(record.error).lower())
                )
                if not matches:
                    continue

            records.append(record)

        return records
