import unittest

from app.evaluator.evaluation_engine import EvaluationEngine
from app.models.evaluation_case import EvaluationCase
from app.models.request_record import RequestRecord


class TestEvaluationEngine(unittest.TestCase):

    def create_case(self):
        return EvaluationCase(
            test_id="SEM-001",
            feature="GIF Replies",
            test_case="Funny message gets a GIF",
            preconditions="GIF feature ON",
            test_steps="Send message and inspect reply",
            test_data="I am basically a cactus now",
            test_case_type="Smoke · Positive",
            expected_result="Memorae replies normally and sends a relevant GIF",
        )

    def create_record(
        self,
        status="SUCCESS",
        retries=0,
        latency_ms=2000,
        failure_type=None,
    ):
        return RequestRecord(
            trace_id="TRACE_001",
            request_id="REQ_001",
            timestamp="2026-08-11T10:00:00Z",
            agent_name="TestAgent",
            prompt="I am basically a cactus now",
            tool_calls=["GIF"],
            retries=retries,
            latency_ms=latency_ms,
            status=status,
            error=None,
            failure_type=failure_type,
        )

    def test_successful_execution_gets_full_score(self):
        engine = EvaluationEngine()
        result = engine.evaluate(self.create_case(), self.create_record())

        self.assertEqual(result.test_id, "SEM-001")
        self.assertEqual(result.status, "PASS")
        self.assertEqual(result.score, 100.0)

    def test_failed_execution_fails_evaluation(self):
        engine = EvaluationEngine()
        record = self.create_record(
            status="FAILED",
            latency_ms=12000,
            failure_type="TIMEOUT",
        )
        result = engine.evaluate(self.create_case(), record)

        self.assertEqual(result.status, "FAIL")
        self.assertEqual(result.failure_type, "TIMEOUT")
        self.assertLess(result.score, 100.0)

    def test_retry_reduces_score(self):
        engine = EvaluationEngine()
        result = engine.evaluate(self.create_case(), self.create_record(retries=2))

        self.assertEqual(result.status, "PASS")
        self.assertLess(result.score, 100.0)
        self.assertEqual(result.failure_type, "HIGH_RETRY")

    def test_high_latency_reduces_score(self):
        engine = EvaluationEngine()
        result = engine.evaluate(self.create_case(), self.create_record(latency_ms=8000))

        self.assertEqual(result.status, "PASS")
        self.assertLess(result.score, 100.0)

    def test_result_contains_execution_details(self):
        engine = EvaluationEngine()
        result = engine.evaluate(
            self.create_case(),
            self.create_record(retries=1, latency_ms=4000),
        )

        self.assertEqual(result.agent_name, "TestAgent")
        self.assertEqual(result.latency_ms, 4000)
        self.assertEqual(result.retries, 1)


if __name__ == "__main__":
    unittest.main()