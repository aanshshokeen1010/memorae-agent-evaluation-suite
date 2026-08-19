from app.models.evaluation_result import EvaluationResult
from app.models.failure_type import FailureType
from app.evaluator.result_comparator import ResultComparator


class EvaluationEngine:
    """
    Evaluates one EvaluationCase against one observed RequestRecord.
    """

    def __init__(self):
        self.comparator = ResultComparator()

    def evaluate(self, evaluation_case, record):

        # -----------------------------------------
        # FAILED AGENT EXECUTION
        # -----------------------------------------
        if record.status != "SUCCESS":

            failure_type = record.failure_type

            if not failure_type:
                failure_type = self._detect_failure_type(record)

            return EvaluationResult(
                test_id=evaluation_case.test_id,
                status="FAIL",
                score=0.0,
                failure_type=failure_type,
                agent_name=record.agent_name,
                latency_ms=record.latency_ms,
                retries=record.retries,
                failure_reason=record.error or "Agent execution failed",
            )

        # -----------------------------------------
        # SUCCESSFUL AGENT EXECUTION
        # -----------------------------------------

        # If the request record does not yet contain
        # an actual response, consider the execution itself successful.
        if record.actual_result:

            status, reason = self.comparator.compare(
                evaluation_case.expected_result,
                record.actual_result,
            )

        else:
            status = "PASS"
            reason = "Agent execution completed successfully."

        score = 100.0

        # High retries reduce quality score but do not fail
        # an otherwise successful execution.
        if record.retries >= 2:
            failure_type = FailureType.HIGH_RETRY.value
            score -= 10.0
        else:
            failure_type = FailureType.SUCCESS.value

        # High latency reduces the score but does not fail
        # the evaluation.
        if record.latency_ms > 5000:
            score -= 10.0

        score = max(score, 0.0)

        return EvaluationResult(
            test_id=evaluation_case.test_id,
            status=status,
            score=score,
            failure_type=failure_type,
            agent_name=record.agent_name,
            latency_ms=record.latency_ms,
            retries=record.retries,
            failure_reason=reason,
        )

    def _detect_failure_type(self, record):

        error = (record.error or "").lower()

        if "timeout" in error:
            return FailureType.TIMEOUT.value

        if "wrong tool" in error:
            return FailureType.WRONG_TOOL.value

        if "memory" in error:
            return FailureType.MEMORY_FAILURE.value

        if "permission" in error:
            return FailureType.PERMISSION_FAILURE.value

        return FailureType.UNKNOWN.value
