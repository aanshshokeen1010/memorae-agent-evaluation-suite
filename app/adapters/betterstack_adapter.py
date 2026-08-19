import os
import json
import requests
from config import (
    REPORT_OUTPUT_DIR,
    BETTERSTACK_SOURCES_ENDPOINT,
    BETTERSTACK_INGESTING_ENDPOINT
)


class BetterStackAdapter:
    """
    Better Stack Telemetry API Adapter.
    Authenticates and interacts directly with the official Better Stack Telemetry API.
    """

    def __init__(self, api_token: str = None, source_id: str = None):
        self.api_token = (api_token or os.getenv("BETTERSTACK_API_TOKEN", "")).strip()
        self.source_id = (source_id or os.getenv("BETTERSTACK_SOURCE_ID", "")).strip()
        self.output_log_file = os.path.join(REPORT_OUTPUT_DIR, "betterstack_live_logs.json")

    def get_sources(self) -> list:
        """
        Queries Better Stack API to list all active sources for the team.
        """
        if not self.api_token:
            return []

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(
                BETTERSTACK_SOURCES_ENDPOINT,
                headers=headers,
                timeout=12
            )
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "data" in data:
                    return data["data"]
                elif isinstance(data, list):
                    return data
            elif response.status_code == 401:
                raise ValueError("Invalid Better Stack Team API Token (401 Unauthorized). Please check your token in Settings.")
            elif response.status_code == 403:
                raise ValueError("Better Stack API Access Denied (403 Forbidden). Verify your API token permissions.")
            return []
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to connect to Better Stack API: {str(e)}")

    def ingest_events(self, events: list, source_token: str = None) -> bool:
        """
        Streams execution log events directly into Better Stack Ingestion Endpoint.
        """
        token = (source_token or self.api_token).strip()
        if not token or not events:
            return False

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                BETTERSTACK_INGESTING_ENDPOINT,
                headers=headers,
                json=events,
                timeout=10
            )
            return response.status_code in [200, 202]
        except Exception:
            return False

    def fetch_logs(self, limit: int = 50, query: str = "") -> str:
        """
        Fetches live telemetry logs from Better Stack with smart source resolution.
        """
        if not self.api_token:
            raise ValueError(
                "Better Stack API Token is required. "
                "Please configure your API token in the Settings drawer (top right gear icon)."
            )

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        # Query all sources for this team
        try:
            response = requests.get(BETTERSTACK_SOURCES_ENDPOINT, headers=headers, timeout=12)
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Network error connecting to Better Stack API: {str(e)}")

        if response.status_code == 401:
            raise ValueError("Invalid Better Stack API Token (401 Unauthorized). Please check your token in Settings.")
        elif response.status_code == 403:
            raise ValueError("Better Stack API Access Denied (403 Forbidden). Verify your API token permissions.")
        elif response.status_code != 200:
            raise RuntimeError(f"Better Stack API returned HTTP {response.status_code}: {response.text}")

        try:
            raw_response = response.json()
        except Exception:
            raise RuntimeError(f"Invalid response received from Better Stack API: {response.text}")

        sources_list = []
        if isinstance(raw_response, dict) and "data" in raw_response:
            sources_list = raw_response["data"]
        elif isinstance(raw_response, list):
            sources_list = raw_response

        # If a specific source_id was provided, resolve by ID or Name
        target_data = sources_list
        if self.source_id and sources_list:
            matched = [
                s for s in sources_list
                if str(s.get("id")) == self.source_id
                or str(s.get("attributes", {}).get("name", "")).lower() == self.source_id.lower()
            ]
            if matched:
                target_data = matched
            else:
                available_names = [
                    f"{s.get('attributes', {}).get('name', 'Source')} (ID: {s.get('id')})"
                    for s in sources_list[:5]
                ]
                names_str = ", ".join(available_names) if available_names else "None"
                raise ValueError(
                    f"Source ID '{self.source_id}' was not found in your Better Stack account. "
                    f"Available sources in your team: {names_str}. "
                    f"You can also leave the Source ID field empty in Settings to use all sources."
                )

        os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)
        with open(self.output_log_file, "w") as f:
            json.dump(target_data, f, indent=2)

        return self.output_log_file