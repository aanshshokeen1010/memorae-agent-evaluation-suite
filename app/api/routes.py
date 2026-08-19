import os
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.api.schemas import PromptRequest, EvaluationResponse, BetterStackTestRequest, BetterStackTestResponse
from app.services.evaluation_service import EvaluationService
from config import REPORT_OUTPUT_DIR, JSON_REPORT_NAME, TEXT_REPORT_NAME, CSV_REPORT_NAME, BETTERSTACK_SOURCES_ENDPOINT

router = APIRouter()

evaluation_service = EvaluationService()


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Agent Evaluation Backend"
    }


@router.post("/betterstack/test-connection", response_model=BetterStackTestResponse)
def test_betterstack_connection(req: BetterStackTestRequest):
    token = req.token.strip()
    if not token:
        return BetterStackTestResponse(
            success=False,
            message="Please enter a Better Stack API Token first."
        )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(
            BETTERSTACK_SOURCES_ENDPOINT,
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            sources = data.get("data", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            formatted_sources = [
                {
                    "id": str(s.get("id")),
                    "name": s.get("attributes", {}).get("name") or f"Source {s.get('id')}"
                }
                for s in sources
            ]
            return BetterStackTestResponse(
                success=True,
                message=f"Better Stack connection verified! Found {len(sources)} active logging source(s).",
                sources_count=len(sources),
                sources=formatted_sources
            )
        elif response.status_code == 401:
            return BetterStackTestResponse(
                success=False,
                message="401 Unauthorized: Invalid Team API Token. Generate one from Better Stack -> API Tokens."
            )
        elif response.status_code == 403:
            return BetterStackTestResponse(
                success=False,
                message="403 Forbidden: Token does not have permission to access sources."
            )
        else:
            return BetterStackTestResponse(
                success=False,
                message=f"Better Stack API returned HTTP {response.status_code}: {response.text}"
            )
    except requests.exceptions.RequestException as e:
        return BetterStackTestResponse(
            success=False,
            message=f"Network error connecting to Better Stack: {str(e)}"
        )


@router.post(
    "/evaluate",
    response_model=EvaluationResponse
)
def evaluate(request: PromptRequest):
    try:
        result = evaluation_service.evaluate(
            prompt=request.prompt or "",
            scenario=request.scenario,
            request_count=request.request_count or 50,
            time_range=request.time_range or "all",
            log_level=request.log_level or "ALL",
            betterstack_token=request.betterstack_token or "",
            betterstack_source_id=request.betterstack_source_id or ""
        )
        return EvaluationResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/download/json")
def download_json_report():
    file_path = os.path.join(REPORT_OUTPUT_DIR, JSON_REPORT_NAME)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=JSON_REPORT_NAME, media_type="application/json")
    return {"error": "Report file not found"}


@router.get("/reports/download/txt")
def download_txt_report():
    file_path = os.path.join(REPORT_OUTPUT_DIR, TEXT_REPORT_NAME)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=TEXT_REPORT_NAME, media_type="text/plain")
    return {"error": "Report file not found"}


@router.get("/reports/download/csv")
def download_csv_report():
    file_path = os.path.join(REPORT_OUTPUT_DIR, CSV_REPORT_NAME)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=CSV_REPORT_NAME, media_type="text/csv")
    return {"error": "Report file not found"}