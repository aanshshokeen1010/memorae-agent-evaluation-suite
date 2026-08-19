# 📘 Memorae.ai — Agent Evaluation & Observability Framework
### Architecture Reference & Feature Guide

---

## 📑 Table of Contents
1. [Overview](#1-overview)
2. [What Better Stack Does Here](#2-what-better-stack-does-here)
3. [Running the Application](#3-running-the-application)
4. [How the Pipeline Works](#4-how-the-pipeline-works)
5. [Feature & UI Guide](#5-feature--ui-guide)
6. [Better Stack Setup](#6-better-stack-setup)
7. [Codebase Map](#7-codebase-map)
8. [Extending the Framework](#8-extending-the-framework)
9. [API Reference](#9-api-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

The **Memorae Agent Evaluation Framework** benchmarks and monitors AI agent execution pipelines.

### Core Functions:
- **Batch Evaluation**: Evaluates agent prompts across batch sizes (20, 50, 100, 200, 500, or custom counts).
- **Failure Classification**: Automatically identifies failure modes (`TIMEOUT`, `MEMORY_FAILURE`, `WRONG_TOOL`, `PERMISSION_FAILURE`, `HIGH_RETRY`).
- **Latency Profiling**: Measures mean latency and percentiles (`p50`, `p90`, `p99`).
- **Execution Timelines**: Visualizes step-by-step agent spans (LLM reasoning, vector retrievals, tool bindings, formatting).
- **Multi-Trace Comparison**: Compares multiple execution traces side by side.
- **Report Generation**: Exports evaluation results to `JSON`, `TXT`, and `CSV`.
- **Telemetry Ingestion**: Ingests real-time execution logs directly from the Better Stack API.

---

## 2. What Better Stack Does Here

Better Stack serves as the live cloud log storage and ingestion layer for agent telemetry.

- **API Integration**: When an evaluation is triggered, the framework queries the Better Stack Telemetry API (`https://telemetry.betterstack.com/api/v1/sources`) using your configured Bearer Token.
- **Filtering**: Supports dynamic team source selection and search query parameters to isolate specific agent logging streams.
- **Log Processing**: The fetched logs are parsed, categorized by failure taxonomy, and rendered into dashboards, scorecards, and reports.

---

## 3. Running the Application

### 1. Start the Backend
```powershell
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```
Backend runs at `http://127.0.0.1:8000`.

### 2. Start the Frontend
```powershell
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 4. How the Pipeline Works

When an evaluation is triggered:

```
[1. User submits Prompt Directive & selects Batch Size]
                      │
                      ▼
[2. BetterStackAdapter queries Better Stack Telemetry API]
                      │
                      ▼
[3. LogParser structures raw event stream into RequestRecords]
                      │
                      ▼
[4. FailureDetector identifies and labels failure categories]
                      │
                      ▼
[5. MetricsEngine calculates Success %, Latency & Percentiles]
                      │
                      ▼
[6. ReportGenerator saves JSON, TXT, and CSV reports]
```

### The 6 Stages:
1. **Input**: Takes a prompt directive and batch size.
2. **Ingestion**: Retrieves log streams from Better Stack API or runs the agent engine.
3. **Parsing**: Converts JSON log events into structured `RequestRecord` objects.
4. **Detection**: Categorizes errors into failure types (`TIMEOUT`, `MEMORY_FAILURE`, `WRONG_TOOL`, `PERMISSION_FAILURE`, `HIGH_RETRY`).
5. **Analytics**: Computes success rates, average latency, and `p50`/`p90`/`p99` latency percentiles.
6. **Reports**: Writes report files to `reports_output/`.

---

## 5. Feature & UI Guide

### Navigation Header
- **Workspace Selector** *(Top-left dropdown)*:
  - `Memorae Core (Production)`: Production environment runs.
  - `Memorae Mobile Apps (Staging)`: Staging environment for mobile integrations.
  - `Memorae Engineering (Internship Team)`: Testing environment for new tools and prompts.
- **Backend Status**: Real-time indicator connected to `GET /health`.
- **Settings**: Drawer to configure Better Stack API credentials.

---

### Tab 1: Command Center
- **Agent Prompt / Task Directive**: Text area for the task to evaluate.
- **Live Presets**: Pre-configured prompt buttons (WhatsApp Briefing, GitHub Issues, GIF Reply, Email Action Items, Calendar Scheduling, Security Credentials).
- **Evaluation Batch Size**: Buttons for `20`, `50`, `100`, `200`, `500` requests, plus a custom number input (1–1000).
- **Run Agent Evaluation**: Starts the evaluation run with progress feedback.

---

### Tab 2: Taxonomy & Analytics
- **Metric Cards**: Total Requests, Success Rate %, Average Latency, p50/p90/p99 Percentiles, Top Failure Mode, Most Failed Agent.
- **Success vs. Failure Donut Chart**: Proportional split between passed and failed requests.
- **Failure Taxonomy Bar Chart**: Distribution of specific failure modes.
- **Agent Scorecards**: Table showing total requests, success rate, and dominant failure modes per sub-agent.

---

### Tab 3: Trace Inspector & Multi-Trace Comparison
- **Search & Filter**: Search by Trace ID, Agent, or Failure Type, with status toggles (`ALL`, `SUCCESS`, `FAILED`).
- **Trace Records Table**: Lists all evaluated requests with latency, status, and tools used.
- **Execution Span Timeline (Waterfall Gantt)**: Click **Inspect** on any trace row to view:
  - 🟣 **LLM Call**: Model reasoning time.
  - 🟢 **Memory Retrieval**: Context lookup duration.
  - 🔵 **Tool Call**: External tool execution time.
  - 🔷 **Agent Chain**: Overall request lifecycle.
  - *Click any span to view its raw input and output JSON payload.*
- **Side-by-Side Multi-Trace Comparison**:
  - Click **Compare Traces** at the top right of the table.
  - Select 2 or more Trace IDs from the dropdown to compare their waterfalls side-by-side.

---

### Tab 4: Reports & Data Exports
- **Download JSON** (`evaluation_report.json`): Structured machine-readable data.
- **Download TXT** (`evaluation_report.txt`): Formatted executive summary.
- **Download CSV** (`evaluation_report.csv`): Per-trace table for spreadsheets and analytics tools.
- **View File**: In-browser preview modal with a copy-to-clipboard button.

---

## 6. Better Stack Setup

1. Copy your **API Token** from the [Better Stack Telemetry Dashboard](https://telemetry.betterstack.com).
2. In the UI, click the **Settings Gear Icon** in the top-right header.
3. Paste the token into the field (add a Source ID if needed).
4. Click **Save Configuration**.
5. Credentials are saved locally in the browser and included with evaluation requests.

---

## 7. Codebase Map

```
agent-evaluation/
├── server.py                          # FastAPI application entry point
├── config.py                          # Framework configuration and defaults
├── main.py                            # CLI evaluation runner
│
├── app/
│   ├── adapters/
│   │   └── betterstack_adapter.py     # Better Stack Telemetry API integration
│   ├── agent/
│   │   └── simulated_agent.py         # AgentExecutionEngine (request event generator)
│   ├── api/
│   │   ├── routes.py                  # API endpoints (/health, /evaluate, /reports/download/*)
│   │   └── schemas.py                 # Request and response models
│   ├── detector/
│   │   └── failure_detector.py        # Failure mode classification
│   ├── metrics/
│   │   └── metrics_engine.py          # Metrics, percentiles (p50/p90/p99), and scorecards
│   ├── models/
│   │   ├── evaluation_metrics.py      # EvaluationMetrics dataclass
│   │   ├── failure_type.py            # FailureType enum
│   │   ├── request_record.py          # RequestRecord data model
│   │   └── span_record.py             # SpanRecord model for waterfall charts
│   ├── parser/
│   │   └── log_parser.py              # LogParser converting raw JSON events into RequestRecords
│   ├── reports/
│   │   └── report_generator.py        # Report writing utilities (JSON, TXT, CSV)
│   └── utils/
│       ├── log_writer.py              # File writing utility
│       └── logger.py                  # Structured Python logger
│
├── frontend/
│   └── src/
│       ├── App.jsx                    # Main UI dashboard
│       └── components/
│           ├── LangSmithWaterfall.jsx # Execution Span Timeline Gantt component
│           ├── SettingsDrawer.jsx     # Better Stack configuration drawer
│           └── ThreadDiffViewer.jsx   # Side-by-Side Multi-Trace comparison modal
│
└── reports_output/                    # Output directory for evaluation reports and logs
```

---

## 8. Extending the Framework

### Adding a Preset Prompt
In `frontend/src/App.jsx`, add an entry to `PRESET_PROMPTS`:
```javascript
{
  label: 'Slack Summary',
  prompt: 'Summarize unread Slack messages in channel #engineering',
  source: 'Slack',
  icon: MessageSquare
}
```

### Adding a Failure Classification Rule
1. In `app/models/failure_type.py`:
```python
DATABASE_ERROR = "DATABASE_ERROR"
```
2. In `app/detector/failure_detector.py`:
```python
elif "database" in error or "sql" in error:
    record.failure_type = FailureType.DATABASE_ERROR.value
```

### Changing Default Batch Size
In `config.py`:
```python
DEFAULT_REQUEST_COUNT = 50
```

---

## 9. API Reference

Base URL: `http://127.0.0.1:8000`

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Backend status check. |
| `/evaluate` | `POST` | Runs batch evaluation for a prompt directive. |
| `/reports/download/json` | `GET` | Downloads the JSON evaluation report. |
| `/reports/download/txt` | `GET` | Downloads the TXT evaluation report. |
| `/reports/download/csv` | `GET` | Downloads the CSV evaluation report. |

#### Request Payload:
```json
{
  "prompt": "Summarize unread WhatsApp voice notes",
  "scenario": "production",
  "request_count": 50,
  "betterstack_token": "bs_token_example",
  "betterstack_source_id": "src_example"
}
```

---

## 10. Troubleshooting

### Port 8000 in use
If port 8000 is occupied, free it using PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Generated Files Location
All generated reports and event logs are saved in `reports_output/`:
- `reports_output/evaluation_report.json`
- `reports_output/evaluation_report.txt`
- `reports_output/evaluation_report.csv`
- `reports_output/betterstack_live_logs.json`
