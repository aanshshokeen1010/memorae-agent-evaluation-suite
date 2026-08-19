from app.rules.base_rule import BaseRule


class SuccessRule(BaseRule):
    """
    Rule that always returns a successful execution.
    """

    def generate_result(self):
        return (
            "SUCCESS",
            None
        )