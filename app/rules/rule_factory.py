from app.rules.success_rule import SuccessRule
from app.rules.timeout_rule import TimeoutRule
from app.rules.memory_rule import MemoryRule
from app.rules.wrong_tool_rule import WrongToolRule
from app.rules.mixed_rule import MixedRule


class RuleFactory:
    """
    Factory responsible for returning the correct rule
    based on the requested evaluation scenario.
    """

    @staticmethod
    def get_rule(scenario: str):

        scenario = scenario.lower()

        rules = {
            "success": SuccessRule(),
            "timeout": TimeoutRule(),
            "memory": MemoryRule(),
            "wrong_tool": WrongToolRule(),
            "mixed": MixedRule(),
        }

        return rules.get(scenario, MixedRule())