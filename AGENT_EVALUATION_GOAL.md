# Agent Evaluation Framework — Project Goal

## 1. Purpose

The Agent Evaluation Framework is designed to provide a structured backend system for evaluating AI agent executions.

The goal is to make agent behavior measurable by collecting execution results, identifying failures, applying evaluation rules, calculating aggregate performance metrics, and producing machine-readable and human-readable reports.

The current implementation uses simulated agent executions so that the complete evaluation pipeline can be developed and validated without depending on production agent infrastructure.

---

## 2. Core Objectives

The framework is intended to:

- Evaluate AI agent execution outcomes consistently.
- Detect and classify common execution failures.
- Measure success, failure, latency, and retry behavior.
- Identify the most common failure category.
- Identify the agent associated with the highest number of failures.
- Identify the worst-performing prompt based on failed-request latency.
- Produce JSON and TXT evaluation reports.
- Expose the evaluation pipeline through a FastAPI `/evaluate` endpoint.
- Provide a stable backend contract for a separate frontend dashboard.

---

## 3. Current Evaluation Scenarios

The backend supports the following simulation scenarios:

| Scenario | Expected behavior |
|---|---|
| `success` | All requests succeed |
| `timeout` | Requests fail because of timeout |
| `memory` | Requests fail because memory retrieval fails |
| `wrong_tool` | Requests fail because the wrong tool is selected |
| `permission` | Requests fail because permission is denied |
| `failure` | Requests fail with an unknown/general execution error |
| `retry` | Requests succeed after a retry |
| `mixed` | Produces a mixture of successful and failed executions |

The `mixed` scenario is the primary demonstration scenario because it exercises multiple parts of the evaluation pipeline in a single run.

---

## 4. Evaluation Flow

The intended logical flow is:

Request
→ Agent Execution
→ Execution Events
→ Request Records
→ Failure Detection
→ Evaluation
→ Metrics Calculation
→ Report Generation
→ API Response

Each stage has a defined responsibility so that execution simulation, failure classification, scoring, metrics, and reporting remain separated.

---

## 5. Evaluation Metrics

The framework currently calculates:

- Total requests
- Successful requests
- Failed requests
- Success rate
- Failure rate
- Average latency
- Top failure category
- Most failed agent
- Worst prompt

These values form the core data required by the frontend dashboard.

The current API exposes the main aggregate metrics. The frontend should display only values actually returned by the backend and should not invent unavailable per-category statistics.

---

## 6. Failure Categories

The framework currently recognizes:

- `SUCCESS`
- `HIGH_RETRY`
- `TIMEOUT`
- `WRONG_TOOL`
- `MEMORY_FAILURE`
- `PERMISSION_FAILURE`
- `UNKNOWN`

Failure classification is based on the request status, retry count, and error information contained in the parsed request record.

---

## 7. API Goal

The backend exposes:

`POST /evaluate`

The request contains:

- `prompt`
- `scenario`

The endpoint runs the evaluation and returns the resulting aggregate metrics together with paths to the generated JSON and TXT reports.

The frontend will consume this API and is responsible for visualization and user interaction.

---

## 8. Development Boundary

### Backend responsibility

The backend owns:

- Simulation
- Event generation
- Request parsing
- Failure classification
- Evaluation rules
- Metric calculation
- Report generation
- API responses
- Automated tests

### Frontend responsibility

The frontend, being developed separately, owns:

- Dashboard UI
- Prompt input
- Scenario selection
- KPI presentation
- Charts and visualizations
- Loading states
- Error states
- User interaction
- Presentation of backend results

The frontend must follow the actual backend API contract.

---

## 9. Current Project State

The backend pipeline is implemented and validated.

The current automated test suite contains 23 tests covering:

- API endpoints
- Success evaluation
- Failed evaluation
- Retry behavior
- Latency scoring
- Failure detection
- Rule factory behavior
- Scenario handling

The test suite currently passes completely.

The backend API has also been manually tested for all supported scenarios.

The frontend is a separate workstream and is expected to be implemented by Aansh.

---

## 10. Future Production Direction

The current system uses simulated/local data for development.

The architecture provides adapter boundaries so that production log sources can be integrated later.

For example, the current Better Stack adapter is a mock adapter that returns the local sample-log path. In a production implementation, this boundary can be replaced with an actual Better Stack API integration without changing the core evaluation logic.

The framework should therefore be treated as a validated evaluation backend/prototype with a clear path toward production log integration.
