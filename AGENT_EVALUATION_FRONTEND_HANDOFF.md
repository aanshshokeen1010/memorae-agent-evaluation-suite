# Agent Evaluation Framework — Frontend Handoff & Project Reference

**Project:** Memorae AI — Engineering Internship  
**Project:** Agent Evaluation Framework  
**Purpose of this document:** Give the frontend developer a complete, self-contained reference for integrating the frontend with the existing backend.

---

## 1. Project Objective

The internship mini-project is an **Agent Evaluation Framework** for evaluating AI-agent executions.

The target Week 3 pipeline is:

```text
Logs
  ↓
Log Parser
  ↓
Failure Detection
  ↓
Metrics / Scoring
  ↓
Report Generation
  ↓
Dashboard / Presentation
```

The internship plan explicitly expects the final system to ingest logs, detect failures automatically, compute evaluation metrics, generate reports, and present the system to stakeholders.

Required final metrics include:

- Total Requests
- Success Rate
- Top Failure
- Average Latency
- Worst Prompt
- Most Failed Agent
- Recommendations

The current backend already implements the core pipeline and exposes a FastAPI `/evaluate` endpoint.

---

# 2. Current Backend Status

The backend is currently working end-to-end.

### Implemented

- FastAPI application
- `/evaluate` REST API
- Swagger/OpenAPI UI
- Simulated agent
- Log writing
- Log parsing
- Failure detection
- Failure taxonomy
- Metrics engine
- Report generation
- JSON report
- TXT report
- Structured logging
- Configuration
- Rule Factory
- Unit tests
- CLI execution

### Current architecture

```text
                    ┌─────────────────────┐
                    │       Frontend      │
                    └──────────┬──────────┘
                               │
                               │ POST /evaluate
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      /evaluate      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ EvaluationService   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        SimulatedAgent     LogWriter       Configuration
              │                │
              └────────────┬───┘
                           ▼
                      LogParser
                           │
                           ▼
                    FailureDetector
                           │
                           ▼
                     MetricsEngine
                           │
                           ▼
                   ReportGenerator
                      │         │
                      ▼         ▼
                   JSON        TXT
                   Report      Report
```

---

# 3. Backend Project Structure

Current project structure:

```text
agent-evaluation/
│
├── README.md
├── requirements.txt
├── main.py
├── server.py
├── config.py
│
├── app/
│   ├── __init__.py
│   │
│   ├── adapters/
│   │   └── __init__.py
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   └── simulated_agent.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── schemas.py
│   │
│   ├── dashboard/
│   │   └── __init__.py
│   │
│   ├── detector/
│   │   ├── __init__.py
│   │   └── failure_detector.py
│   │
│   ├── metrics/
│   │   ├── __init__.py
│   │   └── metrics_engine.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── evaluation_metrics.py
│   │   ├── failure_type.py
│   │   └── request_record.py
│   │
│   ├── parser/
│   │   ├── __init__.py
│   │   ├── log_parser.py
│   │   └── reader.py
│   │
│   ├── reports/
│   │   ├── __init__.py
│   │   └── report_generator.py
│   │
│   ├── rules/
│   │   ├── __init__.py
│   │   ├── base_rule.py
│   │   ├── memory_rule.py
│   │   ├── mixed_rule.py
│   │   ├── rule_factory.py
│   │   ├── success_rule.py
│   │   ├── timeout_rule.py
│   │   └── wrong_tool_rule.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── evaluation_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── log_writer.py
│       └── logger.py
│
├── reports_output/
│   ├── evaluation_report.json
│   └── evaluation_report.txt
│
├── sample_logs/
│   └── sample_events.json
│
├── tests/
│   ├── __init__.py
│   ├── test_rule_factory.py
│   └── test_failure_detector.py
│
└── venv/
```

---

# 4. API Contract

## Endpoint

```http
POST http://127.0.0.1:8000/evaluate
```

Content type:

```http
Content-Type: application/json
```

---

## Request Body

```json
{
  "prompt": "Show my GitHub issues",
  "scenario": "mixed"
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `prompt` | string | Yes | User request to be evaluated |
| `scenario` | string | Yes | Simulation scenario |

---

# 5. Supported Scenarios

The backend Rule Factory currently supports:

```text
success
timeout
memory
wrong_tool
mixed
```

### Meaning

#### `success`

Simulates successful execution.

Expected dashboard state:

```text
Success Rate: high / 100%
Failure Rate: 0%
Top Failure: N/A
```

#### `timeout`

Simulates timeout failures.

Expected:

```text
Top Failure: TIMEOUT
```

#### `memory`

Simulates memory-related failures.

Expected:

```text
Top Failure: MEMORY_FAILURE
```

#### `wrong_tool`

Simulates incorrect tool selection.

Expected:

```text
Top Failure: WRONG_TOOL
```

#### `mixed`

Produces a mixture of success and failure cases.

This is the most useful scenario for demonstrating the dashboard.

---

# 6. API Response

A successful `/evaluate` request currently returns HTTP `200`.

Example:

```json
{
  "prompt": "Show my GitHub issues",
  "total_requests": 20,
  "success_rate": 40,
  "failure_rate": 60,
  "average_latency_ms": 10101.05,
  "top_failure": "TIMEOUT",
  "most_failed_agent": "GithubAgent",
  "report_json": "reports_output/evaluation_report.json",
  "report_txt": "reports_output/evaluation_report.txt"
}
```

### Response fields

| Field | Type | Frontend use |
|---|---|---|
| `prompt` | string | Display evaluated prompt |
| `total_requests` | integer | Total-request KPI |
| `success_rate` | number | Success KPI / chart |
| `failure_rate` | number | Failure KPI / chart |
| `average_latency_ms` | number | Latency KPI |
| `top_failure` | string | Failure KPI |
| `most_failed_agent` | string | Agent KPI |
| `report_json` | string | Report reference |
| `report_txt` | string | Report reference |

---

# 7. Important Difference: CLI vs API

There are currently two execution paths.

## CLI

`main.py` runs one simulated request:

```text
User prompt
    ↓
SimulatedAgent
    ↓
LogWriter
    ↓
Parser
    ↓
FailureDetector
    ↓
MetricsEngine
    ↓
ReportGenerator
```

The CLI has been tested successfully.

Example:

```text
Prompt              : Show my GitHub issues
Total Requests      : 1
Success Rate        : 0.0%
Failure Rate        : 100.0%
Average Latency     : 16636.0 ms
Top Failure         : WRONG_TOOL
Most Failed Agent   : GithubAgent
```

## API

The `EvaluationService` currently runs 20 simulated requests for an evaluation.

Therefore the API normally reports:

```text
Total Requests = 20
```

The frontend should use the **API response**, not CLI output.

---

# 8. Failure Taxonomy

The backend currently detects these categories through `FailureDetector`:

```text
SUCCESS
HIGH_RETRY
TIMEOUT
WRONG_TOOL
MEMORY_FAILURE
PERMISSION_FAILURE
UNKNOWN
```

Detection is based on the request status, retry count, and error text.

Examples:

```text
timeout → TIMEOUT
wrong tool → WRONG_TOOL
memory → MEMORY_FAILURE
permission → PERMISSION_FAILURE
```

Successful requests with two or more retries are classified as:

```text
HIGH_RETRY
```

---

# 9. Metrics

The backend currently calculates evaluation metrics including:

```text
Total Requests
Successful Requests
Failed Requests
Success Rate
Failure Rate
Average Latency
Top Failure
Most Failed Agent
Worst Prompt
```

The API response currently exposes the main dashboard metrics:

```text
total_requests
success_rate
failure_rate
average_latency_ms
top_failure
most_failed_agent
```

The generated report also contains:

```text
successful_requests
failed_requests
worst_prompt
```

---

# 10. Report Generation

The backend creates:

```text
reports_output/evaluation_report.json
reports_output/evaluation_report.txt
```

### JSON report

Contains structured metrics.

### TXT report

Contains a human-readable evaluation summary.

The frontend should present report/download functionality in the dashboard.

---

# 11. Frontend Responsibilities

The frontend is responsible for **presentation and interaction**.

It should NOT reimplement backend evaluation logic.

Do NOT duplicate:

- Failure detection
- Metrics calculation
- Scenario logic
- Agent simulation
- Log parsing
- Report generation

The frontend should call the API and render the response.

---

# 12. Recommended Dashboard Layout

The dashboard should feel like an internal engineering / observability product.

Suggested layout:

```text
┌──────────────────────────────────────────────────────────────┐
│  Agent Evaluation Framework                    ● Backend Live │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Evaluate an Agent                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Show my GitHub issues                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Scenario: [ Mixed ▼ ]               [ Run Evaluation ]      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Requests   Success Rate   Failure Rate   Avg Latency  │
│      20              40%             60%          10.1s      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Success vs Failure        Failure Breakdown                 │
│  ┌───────────────────┐    ┌──────────────────────────────┐   │
│  │       CHART       │    │            CHART             │   │
│  └───────────────────┘    └──────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Top Failure              Most Failed Agent                  │
│  TIMEOUT                  GithubAgent                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Evaluation Report                                            │
│  [ View JSON ]  [ Download JSON ]  [ Download TXT ]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 13. Recommended Frontend Components

Suggested component structure:

```text
src/
├── components/
│   ├── Header
│   ├── PromptInput
│   ├── ScenarioSelector
│   ├── RunEvaluationButton
│   ├── MetricCard
│   ├── MetricsGrid
│   ├── SuccessFailureChart
│   ├── FailureBreakdownChart
│   ├── FailureSummary
│   ├── AgentSummary
│   ├── ReportSection
│   ├── LoadingState
│   └── ErrorState
│
├── services/
│   └── api.js
│
├── pages/
│   └── Dashboard
│
└── App
```

This is a recommendation, not a requirement. Adapt it to the frontend stack already provided.

---

# 14. API Service

Create one central API service rather than making fetch calls throughout components.

Conceptually:

```javascript
POST /evaluate
```

Request:

```javascript
{
  prompt,
  scenario
}
```

Response:

```javascript
{
  prompt,
  total_requests,
  success_rate,
  failure_rate,
  average_latency_ms,
  top_failure,
  most_failed_agent,
  report_json,
  report_txt
}
```

The dashboard state should be updated from this response.

---

# 15. Loading State

Evaluation can take noticeable time because the simulated pipeline generates multiple requests.

When the user clicks:

```text
Run Evaluation
```

the UI should immediately show:

```text
Running evaluation...
Analyzing agent execution...
```

The button should be disabled while the request is running.

Example:

```text
[ ⟳ Running Evaluation... ]
```

After completion:

```text
[ Run Evaluation ]
```

---

# 16. Error Handling

The frontend should handle at least:

### Backend unavailable

```text
Unable to connect to evaluation backend.
Make sure the FastAPI server is running.
```

### HTTP error

```text
Evaluation failed.
Please try again.
```

### Invalid response

```text
Received an unexpected response from the evaluation service.
```

Do not silently fail.

---

# 17. Empty State

Before the first evaluation:

```text
No evaluation results yet.

Enter a prompt and run an evaluation to see
agent performance metrics.
```

Do not show fake metrics.

---

# 18. Dashboard Data Mapping

Use the API fields directly.

### KPI 1

```text
Total Requests
→ total_requests
```

### KPI 2

```text
Success Rate
→ success_rate
```

### KPI 3

```text
Failure Rate
→ failure_rate
```

### KPI 4

```text
Average Latency
→ average_latency_ms
```

Convert milliseconds to seconds only for display if desired.

Example:

```text
10101.05 ms
≈ 10.10 s
```

Keep the original backend value available.

### KPI 5

```text
Top Failure
→ top_failure
```

### KPI 6

```text
Most Failed Agent
→ most_failed_agent
```

---

# 19. Charts

The current API response provides enough information for basic KPI visualizations.

### Recommended first chart

Success vs Failure:

```text
Success: 40%
Failure: 60%
```

A donut/pie chart or horizontal bar chart is appropriate.

### Failure breakdown

The current top-level API response only exposes the **top failure**, not a complete per-category count.

Therefore:

**Do not invent a failure breakdown from the API response.**

If the backend later exposes category counts, the frontend can add a full failure-distribution chart.

For the current version, use the available metrics only.

---

# 20. Report Downloads — Important Integration Note

The API currently returns:

```text
reports_output/evaluation_report.json
reports_output/evaluation_report.txt
```

These are backend filesystem paths.

They are **not automatically browser-download URLs**.

Therefore, do not assume the frontend can simply do:

```javascript
window.open(report_json)
```

and download the file.

Before implementing download buttons, inspect the existing backend routes and frontend integration strategy.

If the backend does not expose report files through HTTP, the clean solution is to add a dedicated backend download/static route later.

Do not modify the backend blindly.

---

# 21. Scenario UX

The scenario selector should show user-friendly names while sending the exact backend values.

Frontend:

```text
Success
Timeout
Memory Failure
Wrong Tool
Mixed
```

Backend values:

```text
success
timeout
memory
wrong_tool
mixed
```

Mapping:

| UI label | API value |
|---|---|
| Success | `success` |
| Timeout | `timeout` |
| Memory Failure | `memory` |
| Wrong Tool | `wrong_tool` |
| Mixed | `mixed` |

Default:

```text
Mixed
```

because it provides the most interesting demonstration.

---

# 22. Suggested Visual Design

The project is an engineering/observability dashboard.

Recommended characteristics:

- Clean
- Professional
- Minimal
- Data-focused
- Strong hierarchy
- Good whitespace
- Clear status indicators
- Responsive
- Dark/light theme only if already supported by the provided frontend

Avoid:

- Excessive gradients
- Huge decorative illustrations
- Unnecessary animations
- Fake data
- Excessive rounded cards
- Consumer/social-media styling

The dashboard should look like an internal AI engineering platform.

---

# 23. Demo Flow

The final stakeholder demo should be:

### Step 1

Start backend:

```bash
source venv/bin/activate
uvicorn server:app --reload
```

### Step 2

Open frontend.

### Step 3

Enter:

```text
Show my GitHub issues
```

### Step 4

Select:

```text
Mixed
```

### Step 5

Click:

```text
Run Evaluation
```

### Step 6

Show loading state.

### Step 7

Display:

```text
Total Requests
Success Rate
Failure Rate
Average Latency
Top Failure
Most Failed Agent
```

### Step 8

Show report section.

### Step 9

Run another scenario, for example:

```text
Timeout
```

and demonstrate that the metrics change.

---

# 24. Backend Verification Already Completed

Unit tests have been added for:

## RuleFactory

Current test result:

```text
6 passed in 0.02s
```

Tests cover:

```text
success
timeout
memory
wrong_tool
mixed
unknown → mixed
```

## FailureDetector

Current test result:

```text
7 passed in 0.02s
```

Tests cover:

```text
success
high retry
timeout
wrong tool
memory failure
permission failure
unknown failure
```

The backend therefore has verified core rule-selection and failure-classification logic.

---

# 25. CLI Verification

The CLI has also been executed successfully.

Example successful run:

```text
Evaluation started for prompt: Show my GitHub issues
Generated 5 log events for request REQ_001
Parsed 1 request records
Metrics calculated successfully
Reports generated successfully
```

Example result:

```text
Total Requests      : 1
Success Rate        : 0.0%
Failure Rate        : 100.0%
Average Latency     : 16636.0 ms
Top Failure         : WRONG_TOOL
Most Failed Agent   : GithubAgent
```

This confirms the complete backend pipeline can execute outside Swagger.

---

# 26. Swagger Verification

The FastAPI Swagger UI has also been tested.

The `/evaluate` endpoint successfully returned HTTP `200`.

Example mixed evaluation returned metrics such as:

```text
Total Requests      : 20
Success Rate        : 40%
Failure Rate        : 60%
Average Latency     : 10101.05 ms
Top Failure         : TIMEOUT
Most Failed Agent   : GithubAgent
```

This is the primary integration contract for the frontend.

---

# 27. Important Backend Behavior

The simulated evaluation is intentionally not always successful.

For example:

```text
success scenario
→ mostly/all successful

timeout scenario
→ timeout failures

wrong_tool scenario
→ wrong-tool failures

memory scenario
→ memory failures

mixed scenario
→ combination of results
```

Therefore:

**A 0% success rate is not automatically a backend bug.**

It may be the expected result of the selected simulation scenario.

The frontend should display the returned evaluation honestly.

---

# 28. Do Not Hardcode Metrics

Never do this:

```javascript
successRate = 40;
failureRate = 60;
```

Always use:

```javascript
result.success_rate
result.failure_rate
```

The dashboard must reflect the actual backend response.

---

# 29. Do Not Create Fake Backend Data

Do not invent:

```text
latency history
agent rankings
failure counts
worst prompts
recommendations
```

unless those fields are actually returned by the backend.

If a visualization requires data that the API does not currently expose, flag it first.

---

# 30. Frontend Acceptance Criteria

The frontend should be considered complete when:

### Functionality

- [ ] Prompt can be entered.
- [ ] Scenario can be selected.
- [ ] `/evaluate` is called correctly.
- [ ] Loading state is visible.
- [ ] Successful response is rendered.
- [ ] Error state is handled.
- [ ] Metrics are displayed correctly.
- [ ] No metrics are hardcoded.
- [ ] Report section is present.
- [ ] Download/view behavior is verified against actual backend routes.

### UI

- [ ] Dashboard looks professional.
- [ ] KPI cards are readable.
- [ ] Charts are understandable.
- [ ] Failure states are visually clear.
- [ ] Empty state is present.
- [ ] Responsive layout works.
- [ ] No unnecessary visual clutter.

### Integration

- [ ] Frontend communicates with local FastAPI backend.
- [ ] CORS is handled if required.
- [ ] API errors are handled.
- [ ] Backend remains unchanged unless a genuine integration gap is confirmed.

---

# 31. Current Known Limitations / Things to Verify

These are important and should NOT be hidden from the frontend developer.

### 1. Report paths

The API returns filesystem paths, not necessarily public HTTP download URLs.

Verify this before implementing download buttons.

### 2. Failure distribution

The API exposes `top_failure`, but not a complete category-count dictionary.

Do not create a fake failure-distribution chart.

### 3. Worst prompt

The report model contains `worst_prompt`, but the current API response shown in testing does not expose it.

Do not assume it exists in the API response.

### 4. Recommendations

Recommendations are part of the internship's target daily report format, but they are not currently shown in the API response demonstrated above.

Do not invent them in the frontend.

### 5. Real production logs

The current demo uses the project's simulated evaluation flow/sample log infrastructure.

The frontend should therefore present this as an **Agent Evaluation Framework / evaluation dashboard**, not claim that the UI itself is directly querying live production Better Stack data unless that integration is actually enabled.

---

# 32. What the Frontend Developer Should NOT Change

Unless explicitly required by integration:

```text
Do not rewrite the evaluation engine.
Do not rewrite failure detection.
Do not rewrite metrics.
Do not change scenario names.
Do not change API response field names.
Do not hardcode evaluation results.
Do not fabricate missing metrics.
Do not remove error handling.
```

The backend should be treated as the source of truth.

---

# 33. Current Backend → Frontend Contract

The frontend's core contract is:

```text
POST /evaluate
```

with:

```json
{
  "prompt": "<user prompt>",
  "scenario": "<success|timeout|memory|wrong_tool|mixed>"
}
```

and response:

```json
{
  "prompt": "...",
  "total_requests": 20,
  "success_rate": 40,
  "failure_rate": 60,
  "average_latency_ms": 10101.05,
  "top_failure": "TIMEOUT",
  "most_failed_agent": "GithubAgent",
  "report_json": "reports_output/evaluation_report.json",
  "report_txt": "reports_output/evaluation_report.txt"
}
```

That is the **minimum guaranteed dashboard data from the currently tested API response**.

---

# 34. Final Goal

The final application should communicate one simple story:

> **"Enter an agent task → run an evaluation → inspect objective performance metrics → identify failures → access the generated report."**

The frontend should make that story obvious within a few seconds of opening the application.

---

# 35. Project Reference

The internship plan defines the final Week 3 objective as an end-to-end agent evaluation pipeline covering:

```text
Log Ingestion
    ↓
Failure Detection
    ↓
Metrics & Scoring
    ↓
Report Automation
    ↓
Stakeholder Presentation
```

The frontend completes the final presentation/dashboard layer.

The dashboard should therefore be built around **evaluation observability and actionable engineering metrics**, rather than being a generic chatbot UI.

---

## Handoff Summary

### Backend: DONE / FROZEN

```text
FastAPI                 ✅
Evaluation pipeline     ✅
Failure detection       ✅
Metrics                 ✅
Reports                 ✅
Logging                 ✅
Unit tests              ✅
Swagger                 ✅
CLI                     ✅
```

### Frontend: NEXT

```text
Dashboard UI             ⬜
Prompt input             ⬜
Scenario selector        ⬜
API integration          ⬜
Loading state             ⬜
Error state               ⬜
Metric cards              ⬜
Charts                    ⬜
Report UI                 ⬜
Download verification     ⬜
Final polish              ⬜
```

**Rule for the next phase:** Build the frontend against the existing API contract first. If the frontend requires a backend capability that is genuinely missing, identify that specific gap before changing backend code.
