"""
config.py

Central configuration for the Agent Evaluation Framework.
"""

# ==========================================
# Report Configuration
# ==========================================

REPORT_OUTPUT_DIR = "reports_output"

JSON_REPORT_NAME = "evaluation_report.json"

TEXT_REPORT_NAME = "evaluation_report.txt"

CSV_REPORT_NAME = "evaluation_report.csv"


# ==========================================
# Better Stack Telemetry API Configuration
# ==========================================

BETTERSTACK_SOURCES_ENDPOINT = "https://telemetry.betterstack.com/api/v1/sources"

BETTERSTACK_INGESTING_ENDPOINT = "https://in.logs.betterstack.com"


# ==========================================
# Execution Batch Configuration
# ==========================================

DEFAULT_REQUEST_COUNT = 50


# ==========================================
# API Configuration
# ==========================================

API_TITLE = "Agent Evaluation Framework"

API_VERSION = "1.0.0"


# ==========================================
# Logging Configuration
# ==========================================

LOG_LEVEL = "INFO"

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(message)s"