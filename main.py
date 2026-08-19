from app.adapters.betterstack_adapter import BetterStackAdapter
from app.detector.failure_detector import FailureDetector
from app.metrics.metrics_engine import MetricsEngine
from app.parser.log_parser import LogParser
from app.reports.report_generator import ReportGenerator
from app.utils.logger import logger


def main():
    logger.info("Starting Better Stack Telemetry Evaluation...")

    adapter = BetterStackAdapter()
    log_file = adapter.fetch_logs()

    parser = LogParser(log_file)
    detector = FailureDetector()
    metrics_engine = MetricsEngine()
    report_generator = ReportGenerator()

    records = parser.parse()
    logger.info(f"Parsed {len(records)} live request records from Better Stack")

    for record in records:
        detector.classify(record)

    metrics = metrics_engine.calculate(records)
    logger.info("Metrics calculated successfully")

    json_path, txt_path, csv_path = report_generator.generate(metrics, records)
    logger.info("Reports generated successfully")

    print("\n===================================")
    print("BETTER STACK LIVE EVALUATION COMPLETED")
    print("===================================\n")

    print(f"Total Requests      : {metrics.total_requests}")
    print(f"Success Rate        : {metrics.success_rate}%")
    print(f"Failure Rate        : {metrics.failure_rate}%")
    print(f"Average Latency     : {metrics.average_latency_ms} ms")
    print(f"Top Failure         : {metrics.top_failure}")
    print(f"Most Failed Agent   : {metrics.most_failed_agent}")

    print("\nGenerated Reports")
    print("-----------------")
    print(f"JSON: {json_path}")
    print(f"TXT : {txt_path}")
    print(f"CSV : {csv_path}")
    logger.info("Evaluation completed")


if __name__ == "__main__":
    main()