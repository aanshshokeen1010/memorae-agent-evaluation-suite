from app.rules.base_rule import BaseRule


class WrongToolRule(BaseRule):
    """
    Rule that applies incorrect tool selection classification.
    """

    def generate_result(self):
        return (
            "FAILED",
            "Wrong Tool Selected"
        )