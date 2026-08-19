from dataclasses import dataclass


@dataclass
class EvaluationCase:
    """
    Represents a single test case used for agent evaluation.

    This model captures the information provided by the
    evaluation/test-case sheet before agent execution.
    """

    test_id: str
    feature: str
    test_case: str
    preconditions: str
    test_steps: str
    test_data: str
    test_case_type: str
    expected_result: str