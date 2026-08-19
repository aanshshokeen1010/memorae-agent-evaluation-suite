import json
import os


class LogWriter:
    """
    Writes generated agent events to a JSON log file.
    """

    def __init__(self, output_file="reports_output/execution_events.json"):
        self.output_file = output_file

    def write(self, events):

        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)

        with open(self.output_file, "w") as file:
            json.dump(events, file, indent=4)