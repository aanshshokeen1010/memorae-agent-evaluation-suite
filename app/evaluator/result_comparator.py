import re


class ResultComparator:
    """
    Compares an expected result from an evaluation test case
    with the actual result produced by the agent.
    """

    FAILURE_INDICATORS = [
        "could not",
        "unable to",
        "failed",
        "failure",
        "error",
        "timeout",
        "not found",
        "denied",
        "cannot",
    ]

    def compare(self, expected_result: str, actual_result: str):
        """
        Compare expected and actual agent results.

        Returns:
            tuple:
                (status, reason)
        """

        expected = (expected_result or "").strip()
        actual = (actual_result or "").strip()

        # No actual response
        if not actual:
            return (
                "FAIL",
                "No actual result was produced by the agent."
            )

        # Exact match
        if expected.lower() == actual.lower():
            return (
                "PASS",
                "Actual result exactly matches the expected result."
            )

        # Detect obvious failure responses
        actual_lower = actual.lower()

        detected_failures = [
            indicator
            for indicator in self.FAILURE_INDICATORS
            if indicator in actual_lower
        ]

        if detected_failures:
            return (
                "FAIL",
                "Actual result contains failure indicators: "
                + ", ".join(detected_failures)
            )

        # Extract meaningful words from expected result
        expected_words = set(
            re.findall(r"\b[a-zA-Z0-9]+\b", expected.lower())
        )

        actual_words = set(
            re.findall(r"\b[a-zA-Z0-9]+\b", actual.lower())
        )

        # Remove very common words
        ignored_words = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "to",
            "of",
            "is",
            "are",
            "was",
            "were",
            "with",
            "that",
            "this",
        }

        expected_words -= ignored_words

        if not expected_words:
            return (
                "FAIL",
                "Expected result does not contain meaningful conditions."
            )

        # Calculate how much of the expected result
        # is represented in the actual result.
        matched_words = expected_words.intersection(actual_words)

        similarity = len(matched_words) / len(expected_words)

        # Require most meaningful expected conditions
        if similarity >= 0.6:
            return (
                "PASS",
                "Actual result contains the required expected conditions."
            )

        return (
            "FAIL",
            "Actual result does not satisfy the expected result."
        )
