from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class PromptRequest(BaseModel):
    prompt: Optional[str] = ""
    scenario: str = "production"
    request_count: Optional[int] = Field(default=50, ge=1, le=1000)
    time_range: Optional[str] = "all"  # "15m", "1h", "24h", "7d", "all"
    log_level: Optional[str] = "ALL"    # "ALL", "ERROR", "WARN", "INFO"
    betterstack_token: Optional[str] = ""
    betterstack_source_id: Optional[str] = ""


class BetterStackTestRequest(BaseModel):
    token: str
    source_id: Optional[str] = ""


class BetterStackTestResponse(BaseModel):
    success: bool
    message: str
    sources_count: Optional[int] = 0
    sources: Optional[List[Dict[str, Any]]] = []


class EvaluationResponse(BaseModel):
    prompt: str

    total_requests: int

    success_rate: float

    failure_rate: float

    average_latency_ms: float

    p50_latency_ms: float = 0.0

    p90_latency_ms: float = 0.0

    p99_latency_ms: float = 0.0

    top_failure: str

    most_failed_agent: str

    report_json: str

    report_txt: str

    report_csv: str = "output_reports/evaluation_report.csv"

    failure_distribution: Dict[str, int] = {}

    agent_scorecards: Dict[str, Any] = {}

    ingestion_mode: str = "Better Stack Live API Ingestion"

    records: List[Dict[str, Any]] = []