from collections import Counter, defaultdict
import numpy as np

from app.models.evaluation_metrics import EvaluationMetrics
from app.models.failure_type import FailureType


class MetricsEngine:
    """
    Calculates overall evaluation metrics from RequestRecord objects.
    """

    def calculate(self, records):

        metrics = EvaluationMetrics()

        metrics.total_requests = len(records)

        total_latency = 0
        latencies = []

        failure_counter = Counter()
        failed_agent_counter = Counter()

        # Agent scorecard tracking
        agent_stats = defaultdict(lambda: {"total": 0, "success": 0, "failed": 0, "failures": Counter()})

        for record in records:

            total_latency += record.latency_ms
            latencies.append(record.latency_ms)

            agent_name = record.agent_name or "GeneralAgent"
            agent_stats[agent_name]["total"] += 1

            if record.status == "SUCCESS":
                metrics.successful_requests += 1
                agent_stats[agent_name]["success"] += 1
            else:
                metrics.failed_requests += 1
                agent_stats[agent_name]["failed"] += 1

            if record.failure_type and record.failure_type != FailureType.SUCCESS.value:
                failure_counter[record.failure_type] += 1
                agent_stats[agent_name]["failures"][record.failure_type] += 1

            if record.status == "FAILED":
                failed_agent_counter[agent_name] += 1

        # Success / Failure Rates & Latencies
        if metrics.total_requests > 0:

            metrics.success_rate = round(
                (metrics.successful_requests / metrics.total_requests) * 100,
                2,
            )

            metrics.failure_rate = round(
                (metrics.failed_requests / metrics.total_requests) * 100,
                2,
            )

            metrics.average_latency_ms = round(
                total_latency / metrics.total_requests,
                2,
            )

            # Calculate Latency Percentiles
            sorted_latencies = sorted(latencies)
            metrics.p50_latency_ms = round(float(np.percentile(sorted_latencies, 50)), 2)
            metrics.p90_latency_ms = round(float(np.percentile(sorted_latencies, 90)), 2)
            metrics.p99_latency_ms = round(float(np.percentile(sorted_latencies, 99)), 2)

        # Most common failure
        if failure_counter:
            metrics.top_failure = failure_counter.most_common(1)[0][0]
            metrics.failure_distribution = dict(failure_counter)
        else:
            metrics.failure_distribution = {}

        # Most failed agent
        if failed_agent_counter:
            metrics.most_failed_agent = failed_agent_counter.most_common(1)[0][0]

        # Worst prompt
        failed_requests = [
            record for record in records if record.status == "FAILED"
        ]

        if failed_requests:
            worst = max(failed_requests, key=lambda x: x.latency_ms)
            metrics.worst_prompt = worst.prompt

        # Build Agent Scorecards
        scorecards = {}
        for agent, stats in agent_stats.items():
            total = stats["total"]
            succ = stats["success"]
            rate = round((succ / total) * 100, 1) if total > 0 else 100.0
            top_fail = stats["failures"].most_common(1)[0][0] if stats["failures"] else "None"
            scorecards[agent] = {
                "total_requests": total,
                "success_requests": succ,
                "failed_requests": stats["failed"],
                "success_rate": rate,
                "top_failure_mode": top_fail
            }
        metrics.agent_scorecards = scorecards

        return metrics