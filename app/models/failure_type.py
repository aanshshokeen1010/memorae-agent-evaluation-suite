from enum import Enum


class FailureType(Enum):
    """
    Standard failure categories used across the evaluation system.
    """

    SUCCESS = "SUCCESS"

    TIMEOUT = "TIMEOUT"

    WRONG_TOOL = "WRONG_TOOL"

    MEMORY_FAILURE = "MEMORY_FAILURE"

    PERMISSION_FAILURE = "PERMISSION_FAILURE"

    HIGH_RETRY = "HIGH_RETRY"

    UNKNOWN = "UNKNOWN"