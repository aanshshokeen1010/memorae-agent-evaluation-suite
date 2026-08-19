import csv

from app.models.evaluation_case import EvaluationCase


class TestCaseLoader:
    """
    Loads evaluation test cases from a CSV file
    and converts them into EvaluationCase objects.
    """

    REQUIRED_COLUMNS = [
        "Test ID",
        "Feature (Module)",
        "Test Case",
        "Preconditions",
        "Test Steps",
        "Test Data",
        "Test Case Type",
        "Expected Result",
    ]

    def load(self, file_path: str):
        """
        Load test cases from CSV.

        Args:
            file_path: Path to the CSV test-case file.

        Returns:
            List of EvaluationCase objects.

        Raises:
            ValueError: If required columns are missing.
        """

        test_cases = []

        with open(
            file_path,
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            # -----------------------------------------
            # Validate header row
            # -----------------------------------------
            if not reader.fieldnames:
                raise ValueError(
                    "Test case file has no header row."
                )

            # -----------------------------------------
            # Check required columns
            # -----------------------------------------
            missing_columns = [
                column
                for column in self.REQUIRED_COLUMNS
                if column not in reader.fieldnames
            ]

            if missing_columns:
                raise ValueError(
                    f"Missing required columns: {missing_columns}"
                )

            # -----------------------------------------
            # Convert rows into EvaluationCase objects
            # -----------------------------------------
            for row in reader:

                test_id = (
                    row.get("Test ID") or ""
                ).strip()

                # Skip completely empty rows
                if not test_id:
                    continue

                test_case = EvaluationCase(
                    test_id=test_id,
                    feature=(
                        row.get("Feature (Module)") or ""
                    ).strip(),

                    test_case=(
                        row.get("Test Case") or ""
                    ).strip(),

                    preconditions=(
                        row.get("Preconditions") or ""
                    ).strip(),

                    test_steps=(
                        row.get("Test Steps") or ""
                    ).strip(),

                    test_data=(
                        row.get("Test Data") or ""
                    ).strip(),

                    test_case_type=(
                        row.get("Test Case Type") or ""
                    ).strip(),

                    expected_result=(
                        row.get("Expected Result") or ""
                    ).strip(),
                )

                test_cases.append(test_case)

        return test_cases