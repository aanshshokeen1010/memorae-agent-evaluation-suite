from app.rules.base_rule import BaseRule


class TimeoutRule(BaseRule):
    """
    Rule that applies timeout failure classification.
    """

    def generate_result(self):
        return (
            "FAILED",
            "Timeout"
        )