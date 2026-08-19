from app.rules.base_rule import BaseRule


class MemoryRule(BaseRule):
    """
    Rule that applies memory retrieval failure classification.
    """

    def generate_result(self):
        return (
            "FAILED",
            "Memory Not Found"
        )