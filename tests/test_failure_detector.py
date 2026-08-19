import unittest

from app.detector.failure_detector import FailureDetector
from app.models.failure_type import FailureType
from app.models.request_record import RequestRecord


class TestFailureDetector(unittest.TestCase):

    def setUp(self):
        self.detector = FailureDetector()

    def create_record(self, status, error=None, retries=0):
        return RequestRecord(
            trace_id="TRACE_001",
            request_id="REQ_001",
            timestamp="2026-08-07T10:00:00Z",
            agent_name="TestAgent",
            prompt="Test Prompt",
            tool_calls=[],
            retries=retries,
            latency_ms=1000,
            status=status,
            error=error,
            failure_type=None
        )

    def test_success(self):
        record = self.create_record(status="SUCCESS")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.SUCCESS.value)

    def test_high_retry(self):
        record = self.create_record(status="SUCCESS", retries=2)
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.HIGH_RETRY.value)

    def test_timeout(self):
        record = self.create_record(status="FAILED", error="Timeout")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.TIMEOUT.value)

    def test_wrong_tool(self):
        record = self.create_record(status="FAILED", error="Wrong Tool Selected")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.WRONG_TOOL.value)

    def test_memory_failure(self):
        record = self.create_record(status="FAILED", error="Memory Not Found")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.MEMORY_FAILURE.value)

    def test_permission_failure(self):
        record = self.create_record(status="FAILED", error="Permission Denied")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.PERMISSION_FAILURE.value)

    def test_unknown_failure(self):
        record = self.create_record(status="FAILED", error="Some Completely Unknown Error")
        self.detector.classify(record)
        self.assertEqual(record.failure_type, FailureType.UNKNOWN.value)


if __name__ == "__main__":
    unittest.main()