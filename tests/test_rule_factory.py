import unittest

from app.rules.rule_factory import RuleFactory
from app.rules.success_rule import SuccessRule
from app.rules.timeout_rule import TimeoutRule
from app.rules.memory_rule import MemoryRule
from app.rules.wrong_tool_rule import WrongToolRule
from app.rules.mixed_rule import MixedRule


class TestRuleFactory(unittest.TestCase):

    def test_success_rule(self):
        rule = RuleFactory.get_rule("success")
        self.assertIsInstance(rule, SuccessRule)

    def test_timeout_rule(self):
        rule = RuleFactory.get_rule("timeout")
        self.assertIsInstance(rule, TimeoutRule)

    def test_memory_rule(self):
        rule = RuleFactory.get_rule("memory")
        self.assertIsInstance(rule, MemoryRule)

    def test_wrong_tool_rule(self):
        rule = RuleFactory.get_rule("wrong_tool")
        self.assertIsInstance(rule, WrongToolRule)

    def test_mixed_rule(self):
        rule = RuleFactory.get_rule("mixed")
        self.assertIsInstance(rule, MixedRule)

    def test_unknown_rule_defaults_to_mixed(self):
        rule = RuleFactory.get_rule("unknown")
        self.assertIsInstance(rule, MixedRule)


if __name__ == "__main__":
    unittest.main()