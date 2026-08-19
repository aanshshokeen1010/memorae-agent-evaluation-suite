from dataclasses import dataclass, field
from typing import Dict, Any


@dataclass
class EvaluationMetrics:
    """
    Stores the overall evaluation metrics for all processed requests.
    """

    total_requests: int = 0

    successful_requests: int = 0

    failed_requests: int = 0

    success_rate: float = 0.0

    failure_rate: float = 0.0

    average_latency_ms: float = 0.0

    p50_latency_ms: float = 0.0

    p90_latency_ms: float = 0.0

    p99_latency_ms: float = 0.0

    top_failure: str = "N/A"

    most_failed_agent: str = "N/A"

    worst_prompt: str = "N/A"

    failure_distribution: Dict[str, int] = field(default_factory=dict)

    agent_scorecards: Dict[str, Any] = field(default_factory=dict)