# Memorae Agent Evaluation & Observability Framework

[![CI Pipeline](https://github.com/aanshshokeen1010/memorae-agent-evaluation-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/aanshshokeen1010/memorae-agent-evaluation-suite/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)
![Better Stack](https://img.shields.io/badge/Better%20Stack-Telemetry%20API-06B6D4)
![Tests](https://img.shields.io/badge/Unit%20Tests-21%2F21%20Passing-brightgreen)

An automated evaluation, diagnostics, and failure taxonomy framework for Memorae.ai agents, integrated with Better Stack Telemetry.

This framework ingests live telemetry logs from Better Stack, normalizes multi-agent execution events, classifies failure modes (timeouts, tool errors, memory retrieval faults, permission issues), computes latency percentiles (p50, p90, p99), and provides execution span waterfall timelines.

---

## Architecture Overview

```
Better Stack Telemetry API / Agent Log Stream
                      │
                      ▼
            BetterStackAdapter
                      │
                      ▼
                  LogParser  ───► Normalizes JSON payloads into RequestRecords
                      │
                      ▼
               FailureDetector ───► Classifies Failure Taxonomy & Retries
                      │
                      ▼
                MetricsEngine ───► Computes Success Rates & p50/p90/p99 Latency
                      │
                      ▼
               ReportGenerator ───► Outputs JSON, TXT, and CSV Artifacts
                      │
                      ▼
               FastAPI Backend ───► React / Vite Observability Dashboard
```

---

## Failure Taxonomy

The framework automatically categorizes agent execution failures into standard classifications:

| Category | Description |
|---|---|
| `SUCCESS` | Request finished within SLA without unhandled exceptions. |
| `HIGH_RETRY` | Request succeeded but required multiple retry attempts. |
| `TIMEOUT` | Execution exceeded the maximum latency threshold. |
| `WRONG_TOOL` | Planner selected an incompatible or invalid tool binding. |
| `MEMORY_FAILURE` | Memory vector retrieval or context lookup failed. |
| `PERMISSION_FAILURE` | Authentication, authorization, or role permission denied. |
| `UNKNOWN` | Unclassified runtime exception logged by the service. |

---

## Project Structure

```
agent-evaluation/
├── app/
│   ├── adapters/          # Better Stack Telemetry API client
│   ├── api/               # FastAPI endpoints, routes, and schemas
│   ├── detector/          # Failure taxonomy classification engine
│   ├── metrics/           # Aggregate metric & latency percentile calculator
│   ├── models/            # Domain models (RequestRecord, FailureType, EvaluationResult)
│   ├── parser/            # Log parser & payload normalizer
│   ├── reports/           # JSON, Plaintext, and CSV report generator
│   └── utils/             # Logging and helper utilities
├── frontend/              # React + Vite observability dashboard
│   ├── src/
│   │   ├── components/    # Waterfall Gantt chart, Trace Diff viewer, Settings
│   │   ├── App.jsx        # Main application dashboard
│   │   └── index.css      # Styling & theme definitions
├── tests/                 # Automated unit test suite (21 unit tests)
├── config.py              # Configuration settings and API endpoints
├── server.py              # FastAPI server entrypoint
├── requirements.txt       # Python dependencies
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Clone repository
git clone <repo-url>
cd agent-evaluation

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be live at `http://127.0.0.1:8000`. Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at `http://localhost:5173`.

---

## Running Automated Tests

Run the complete test suite using Python's built-in `unittest` runner:

```bash
python -m unittest discover tests
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint returning backend status. |
| `POST` | `/betterstack/test-connection` | Validates Better Stack token and lists active team sources. |
| `POST` | `/evaluate` | Ingests telemetry, classifies traces, and generates analytics. |
| `GET` | `/reports/download/json` | Downloads the generated `evaluation_report.json`. |
| `GET` | `/reports/download/txt` | Downloads the generated `evaluation_report.txt`. |
| `GET` | `/reports/download/csv` | Downloads the generated `evaluation_report.csv`. |

---

## Configuration

Environment variables can be defined in a `.env` file or passed through the UI Settings drawer:

```env
BETTERSTACK_API_TOKEN=your_betterstack_team_token
BETTERSTACK_SOURCE_ID=your_source_id_optional
PORT=8000
HOST=127.0.0.1
```
