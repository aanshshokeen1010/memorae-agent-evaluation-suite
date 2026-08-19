from abc import ABC, abstractmethod


class BaseRule(ABC):
    """
    Base class for all evaluation rules.

    Every rule must implement the generate_result() method.
    """

    @abstractmethod
    def generate_result(self):
        """
        Returns:
            tuple(status, error)

        Example:
            ("SUCCESS", None)

        or

            ("FAILED", "Timeout")
        """
        pass