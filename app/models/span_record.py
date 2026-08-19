from dataclasses import dataclass, asdict
from typing import Optional, Any

@dataclass
class SpanRecord:
    span_id: str
    parent_span_id: Optional[str]
    name: str
    span_type: str  # "LLM" | "TOOL" | "MEMORY" | "RETRIEVER" | "CHAIN"
    start_time_ms: int
    duration_ms: int
    input_payload: Optional[Any] = None
    output_payload: Optional[Any] = None
    status: str = "SUCCESS"  # "SUCCESS" | "FAILED"

    def to_dict(self):
        return asdict(self)
