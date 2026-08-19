from app.parser.test_case_loader import TestCaseLoader
from app.parser.log_parser import LogParser
from app.evaluator.evaluation_engine import EvaluationEngine


class TestCaseService:
    __test__ = False
    """
    Orchestrates the evaluation of test cases against parsed log records.
    """

    def __init__(self):
        self.loader = TestCaseLoader()
        self.engine = EvaluationEngine()

    def evaluate_file(self, file_path: str, log_file: str = "reports_output/betterstack_live_logs.json"):
        """
        Load test cases from CSV and evaluate each case against parsed log records.
        """
        test_cases = self.loader.load(file_path)
        parser = LogParser(log_file)
        records = parser.parse()

        results = []
        for test_case in test_cases:
            request_id = f"REQ_{test_case.test_id}"
            matched_record = next((r for r in records if r.request_id == request_id or r.trace_id == f"TRACE_{request_id}"), None)
            if matched_record:
                result = self.engine.evaluate(test_case, matched_record)
                results.append(result)

        return results