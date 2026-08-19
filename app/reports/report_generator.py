import csv
import json
import os
from config import (
    REPORT_OUTPUT_DIR,
    JSON_REPORT_NAME,
    TEXT_REPORT_NAME,
)

CSV_REPORT_NAME = "evaluation_report.csv"


class ReportGenerator:
    """
    Generates evaluation reports in JSON, TXT, and CSV formats.
    """

    def __init__(self, output_folder=REPORT_OUTPUT_DIR):
        self.output_folder = output_folder

        os.makedirs(self.output_folder, exist_ok=True)

    def generate(self, metrics, records=None):

        report = {
            "total_requests": metrics.total_requests,
            "successful_requests": metrics.successful_requests,
            "failed_requests": metrics.failed_requests,
            "success_rate": metrics.success_rate,
            "failure_rate": metrics.failure_rate,
            "average_latency_ms": metrics.average_latency_ms,
            "p50_latency_ms": getattr(metrics, "p50_latency_ms", 0.0),
            "p90_latency_ms": getattr(metrics, "p90_latency_ms", 0.0),
            "p99_latency_ms": getattr(metrics, "p99_latency_ms", 0.0),
            "top_failure": metrics.top_failure,
            "most_failed_agent": metrics.most_failed_agent,
            "worst_prompt": metrics.worst_prompt,
            "failure_distribution": getattr(metrics, "failure_distribution", {}),
            "agent_scorecards": getattr(metrics, "agent_scorecards", {})
        }

        json_path = os.path.join(
            self.output_folder,
            JSON_REPORT_NAME
        )

        txt_path = os.path.join(
            self.output_folder,
            TEXT_REPORT_NAME
        )

        csv_path = os.path.join(
            self.output_folder,
            CSV_REPORT_NAME
        )

        with open(json_path, "w") as file:
            json.dump(report, file, indent=4)

        with open(txt_path, "w") as file:

            file.write("MEMORAE AGENT EVALUATION REPORT\n")
            file.write("=" * 40 + "\n\n")

            for key, value in report.items():
                file.write(f"{key}: {value}\n")

        # Write CSV report if records are provided
        with open(csv_path, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["trace_id", "request_id", "timestamp", "agent_name", "status", "failure_type", "latency_ms", "retries", "error"])
            if records:
                for rec in records:
                    writer.writerow([
                        rec.trace_id,
                        rec.request_id,
                        rec.timestamp,
                        rec.agent_name,
                        rec.status,
                        rec.failure_type or "NONE",
                        rec.latency_ms,
                        rec.retries,
                        rec.error or ""
                    ])

        return json_path, txt_path, csv_path