import random

from app.rules.base_rule import BaseRule


class MixedRule(BaseRule):
    """
    Returns a realistic mix of successful and failed executions.
    """

    def generate_result(self):

        outcomes = [
            ("SUCCESS", None),
            ("SUCCESS", None),
            ("SUCCESS", None),
            ("FAILED", "Timeout"),
            ("FAILED", "Wrong Tool Selected"),
            ("FAILED", "Memory Not Found"),
            ("FAILED", "Permission Denied"),
        ]

        return random.choice(outcomes)