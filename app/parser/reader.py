import json


class LogReader:
    """
    Responsible only for reading raw log events from a JSON file.
    """

    def read(self, file_path: str):

        with open(file_path, "r") as file:
            return json.load(file)