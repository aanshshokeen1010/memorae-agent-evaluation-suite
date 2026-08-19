from app.models.failure_type import FailureType
from app.models.request_record import RequestRecord


class FailureDetector:
    """
    Classifies each RequestRecord into a failure category.
    """

    def classify(self, record: RequestRecord) -> RequestRecord:

        # Successful request
        if record.status == "SUCCESS":

            if record.retries >= 2:
                record.failure_type = FailureType.HIGH_RETRY.value
            else:
                record.failure_type = FailureType.SUCCESS.value

            return record

        # Failed requests
        error = (record.error or "").lower()

        if "timeout" in error or "timed out" in error:
            record.failure_type = FailureType.TIMEOUT.value

        elif "wrong tool" in error:
            record.failure_type = FailureType.WRONG_TOOL.value

        elif "memory" in error:
            record.failure_type = FailureType.MEMORY_FAILURE.value

        elif "permission" in error:
            record.failure_type = FailureType.PERMISSION_FAILURE.value

        else:
            record.failure_type = FailureType.UNKNOWN.value

        return record