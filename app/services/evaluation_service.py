import os
from app.adapters.betterstack_adapter import BetterStackAdapter
from app.detector.failure_detector import FailureDetector
from app.metrics.metrics_engine import MetricsEngine
from app.parser.log_parser import LogParser
from app.reports.report_generator import ReportGenerator
from config import REPORT_OUTPUT_DIR, DEFAULT_REQUEST_COUNT


class EvaluationService:
    """
    Pure Live Better Stack Telemetry Evaluation Pipeline:
    1. Authenticates strictly with Better Stack Telemetry API.
    2. Fetches live agent event streams from the cloud.
    3. Normalizes and parses incoming events into RequestRecord models.
    4. Classifies failure taxonomy & computes p50/p90/p99 latency percentiles.
    5. Generates JSON, TXT, and CSV evaluation report artifacts.
    """

    def __init__(self, adapter=None):
        self.adapter = adapter or BetterStackAdapter()
        self.detector = FailureDetector()
        self.metrics_engine = MetricsEngine()
        self.report_generator = ReportGenerator()

    def evaluate(
        self,
        prompt: str = "",
        scenario: str = "production",
        request_count: int = DEFAULT_REQUEST_COUNT,
        time_range: str = "all",
        log_level: str = "ALL",
        betterstack_token: str = "",
        betterstack_source_id: str = ""
    ) -> dict:

        ingestion_mode = "Better Stack Live Telemetry API"

        # 1. Initialize Better Stack API adapter with user credentials
        bs_adapter = BetterStackAdapter(
            api_token=betterstack_token.strip(),
            source_id=betterstack_source_id.strip()
        )

        # 2. Fetch live logs directly from Better Stack API
        fetched_file = bs_adapter.fetch_logs(limit=request_count, query=prompt)

        # 3. Parse real log streams into RequestRecord models with level & keyword filters
        parser = LogParser(fetched_file)
        records = parser.parse(log_level=log_level, query=prompt)

        # 4. Handle empty state if no active agent logs exist in Better Stack yet
        if not records:
            empty_report_dir = REPORT_OUTPUT_DIR
            os.makedirs(empty_report_dir, exist_ok=True)
            return {
                "prompt": prompt,
                "total_requests": 0,
                "success_rate": 0.0,
                "failure_rate": 0.0,
                "average_latency_ms": 0.0,
                "p50_latency_ms": 0.0,
                "p90_latency_ms": 0.0,
                "p99_latency_ms": 0.0,
                "top_failure": "None",
                "most_failed_agent": "None",
                "report_json": os.path.join(empty_report_dir, "evaluation_report.json"),
                "report_txt": os.path.join(empty_report_dir, "evaluation_report.txt"),
                "report_csv": os.path.join(empty_report_dir, "evaluation_report.csv"),
                "failure_distribution": {},
                "agent_scorecards": {},
                "ingestion_mode": ingestion_mode,
                "records": []
            }

        # 5. Classify failure taxonomy
        for record in records:
            self.detector.classify(record)

        # 6. Calculate metrics & percentiles
        metrics = self.metrics_engine.calculate(records)

        # 7. Generate evaluation reports
        json_path, txt_path, csv_path = self.report_generator.generate(metrics, records)

        serialized_records = [r.to_dict() if hasattr(r, 'to_dict') else r for r in records]

        return {
            "prompt": prompt,
            "total_requests": metrics.total_requests,
            "success_rate": metrics.success_rate,
            "failure_rate": metrics.failure_rate,
            "average_latency_ms": metrics.average_latency_ms,
            "p50_latency_ms": getattr(metrics, "p50_latency_ms", 0.0),
            "p90_latency_ms": getattr(metrics, "p90_latency_ms", 0.0),
            "p99_latency_ms": getattr(metrics, "p99_latency_ms", 0.0),
            "top_failure": metrics.top_failure,
            "most_failed_agent": metrics.most_failed_agent,
            "report_json": json_path,
            "report_txt": txt_path,
            "report_csv": csv_path,
            "failure_distribution": metrics.failure_distribution or {},
            "agent_scorecards": getattr(metrics, "agent_scorecards", {}),
            "ingestion_mode": ingestion_mode,
            "records": serialized_records
        }