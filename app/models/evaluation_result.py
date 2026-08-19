from dataclasses import dataclass


@dataclass
class EvaluationResult:
    """
    Represents the result of evaluating one test case.

    This model stores the outcome produced after combining
    the evaluation case with the observed agent execution.
    """

    test_id: str

    status: str = "UNKNOWN"

    score: float = 0.0

    failure_type: str = "N/A"

    agent_name: str = "N/A"

    latency_ms: float = 0.0

    retries: int = 0

    failure_reason: str = "N/A"