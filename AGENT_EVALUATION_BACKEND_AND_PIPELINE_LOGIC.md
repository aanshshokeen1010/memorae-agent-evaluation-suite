# Agent Evaluation Framework
## Backend & Evaluation Pipeline Logic

## 1. Objective

The objective of this project is to build an evaluation pipeline that can analyze AI-agent executions, identify failures, calculate objective performance metrics, generate evaluation reports, and present the results through a dashboard.

The proposed end-to-end pipeline is:

```text
Evaluation Input
        ↓
Log Ingestion
        ↓
Log Parsing
        ↓
Failure Detection
        ↓
Metrics & Scoring
        ↓
Report Generation
        ↓
Dashboard
        ↓
Stakeholder Demo
```

The implementation will be developed incrementally, with the actual production Better Stack log schema and the agreed evaluation taxonomy treated as the source of truth.

---

## 2. Evaluation Philosophy

The system should evaluate an agent based on observable execution behaviour rather than only whether a final response was produced.

The evaluation should consider:

- Correctness
- Planning / execution behaviour
- Memory usage
- Tool usage
- Failures
- Retries
- Latency
- Overall execution outcome

The evaluation pipeline should convert raw agent execution logs into structured evaluation records and then into measurable performance results.

The exact scoring interpretation should follow the agreed evaluation rubric rather than introducing an unapproved scoring formula.

---

## 3. Evaluation Input

The evaluation begins with an input representing an agent task.

Example:

```text
Show my GitHub issues
```

The input may contain:

- User prompt
- Expected task
- Agent/task context
- Evaluation scenario, where applicable

The input initiates the evaluation process.

The evaluation input should eventually be associated with the corresponding execution logs so that the system can evaluate the actual agent behaviour for that task.

---

## 4. Log Ingestion

The intended production source is Better Stack / Memorae execution logs.

The ingestion layer should:

- Obtain the raw execution logs associated with an evaluation.
- Pass the raw log events to the parsing layer.
- Preserve the original information required for evaluation.
- Avoid manual transformation wherever possible.

The actual production log structure must be confirmed before implementing production parsing rules.

The system should not assume field names, nesting, message formats, or event relationships until the actual Better Stack schema is available.

The current prototype uses simulated/sample execution logs to validate the pipeline architecture.

---

## 5. Log Parsing

Raw log events are converted into normalized request-level records.

The parser should extract information such as:

- Trace ID
- Request ID
- Timestamp
- Agent name
- Prompt
- Tool calls
- Errors
- Retry count
- Latency
- Request status

The output of the parser should be a normalized evaluation record that can be consumed consistently by the failure detection and metrics layers.

Example normalized record:

```json
{
    "trace_id": "...",
    "request_id": "...",
    "timestamp": "...",
    "agent_name": "...",
    "prompt": "...",
    "tool_calls": [],
    "retries": 0,
    "latency_ms": 1200,
    "status": "SUCCESS",
    "error": null
}
```

The normalized record is an internal representation. The exact mapping from Better Stack fields to these fields will be defined after the production schema is confirmed.

---

## 6. Failure Detection

The failure detection layer classifies each normalized execution record.

The agreed failure taxonomy should cover:

- Prompt Failure
- Tool Failure
- Memory Failure
- Timeout
- Permission Failure
- Wrong Tool
- Hallucination
- Context Loss

The production taxonomy should be validated against the agreed Week 2 taxonomy and the available labeled production logs.

The detector should return either:

- A specific failure category
- `SUCCESS`
- No applicable failure

The classification should be deterministic and based on observable execution information wherever possible.

The current prototype contains a smaller implemented detector taxonomy. The production implementation will be expanded and validated against the agreed taxonomy rather than assuming that the prototype categories are final.

---

## 7. Failure Detection Validation

Before considering the automated failure detector production-ready, it should be validated against a reference set of labeled production logs.

The validation process will be:

```text
Better Stack Production Logs
        ↓
Reference / Labeled Dataset
        ↓
Automated Failure Detection
        ↓
Compare Automated Labels
        ↓
Measure Classification Agreement
        ↓
Refine Rules if Required
```

The reference labels should follow the agreed failure taxonomy.

The purpose of this validation is to determine whether the automated classifier consistently identifies failures in the same way as the agreed reference labels.

The classification results should be measured before the final rules are considered stable.

---

## 8. Metrics & Scoring

After failure classification, the metrics engine aggregates the evaluation records.

### Request Metrics

- Total Requests
- Successful Requests
- Failed Requests
- Success Rate
- Failure Rate

### Performance Metrics

- Average Latency
- Worst Prompt
- Most-Failed Agent

### Failure Metrics

- Top Failure
- Failure distribution, when sufficient category-level data is available

### Evaluation Scoring

The evaluation rubric should consider the agreed dimensions:

- Correctness
- Planning
- Memory
- Tool Usage
- Latency
- Overall performance

The exact scoring calculation should follow the agreed evaluation rubric.

The system should not introduce an arbitrary weighted score without first confirming the scoring methodology.

---

## 9. Report Generation

The report generation layer converts the calculated metrics and evaluation results into a structured evaluation report.

The target report should contain:

- Total Requests
- Success Rate
- Top Failure
- Average Latency
- Worst Prompt
- Most-Failed Agent
- Recommendations

The report should be generated automatically without requiring manual calculation.

Possible output formats include:

- JSON
- Human-readable TXT
- Dashboard-consumable structured response

Recommendations should be derived from the observed evaluation results rather than being static or fabricated.

---

## 10. Dashboard

The dashboard is the presentation layer of the evaluation system.

It should consume backend-generated evaluation results rather than reimplement evaluation logic.

The dashboard should provide:

- Evaluation input
- Evaluation status
- Key performance metrics
- Success/failure visualization
- Failure summary
- Agent-level insights
- Report access

The frontend must use backend-generated values and must not fabricate missing metrics.

If a visualization requires information that the backend does not expose, the required backend field should be identified before implementing the visualization.

---

## 11. End-to-End Data Flow

The complete target flow is:

```text
User / Evaluation Input
        ↓
Better Stack / Log Source
        ↓
Log Ingestion
        ↓
Log Parser
        ↓
Normalized Request Records
        ↓
Failure Detection
        ↓
Classified Evaluation Records
        ↓
Metrics & Scoring Engine
        ↓
Evaluation Metrics
        ↓
Report Generator
        ↓
API Response / Report
        ↓
Dashboard
        ↓
Stakeholder Presentation
```

---

## 12. Backend Component Responsibilities

### Log Ingestion

Responsible for obtaining raw execution logs from the configured log source.

### Log Parser

Responsible for converting raw log events into normalized request-level records.

### Failure Detector

Responsible for classifying execution records according to the agreed failure taxonomy.

### Metrics Engine

Responsible for calculating evaluation metrics and aggregating execution results.

### Scoring Layer

Responsible for applying the agreed evaluation rubric to the available execution evidence.

### Report Generator

Responsible for generating structured evaluation reports and recommendations.

### API Layer

Responsible for exposing evaluation results to the frontend through a stable API contract.

### Dashboard

Responsible only for presentation, visualization, and user interaction.

---

## 13. Separation of Responsibilities

The backend should remain the source of truth for evaluation results.

The frontend should NOT:

- Parse logs
- Detect failures
- Calculate success rates
- Calculate latency
- Determine the top failure
- Generate evaluation results
- Invent unavailable metrics

The frontend should call the backend and render the returned results.

This keeps evaluation logic centralized and prevents differences between backend calculations and dashboard calculations.

---

## 14. Current Prototype vs Target System

### Current prototype

The current implementation validates the evaluation pipeline using simulated/sample agent execution logs.

Current flow:

```text
Simulated Agent
        ↓
Log Writer
        ↓
Log Parser
        ↓
Failure Detector
        ↓
Metrics Engine
        ↓
Report Generator
        ↓
FastAPI
```

The prototype is useful for validating the architecture and core processing components.

### Target production-oriented system

The target system is:

```text
Better Stack / Production Logs
        ↓
Log Ingestion
        ↓
Log Parser
        ↓
Failure Detection
        ↓
Metrics & Scoring
        ↓
Automated Report
        ↓
Dashboard
        ↓
Stakeholder Demo
```

The production implementation will be based on the actual Better Stack log schema and the agreed evaluation taxonomy.

---

## 15. Implementation Strategy

The project should be developed incrementally.

### Phase 1 — Evaluation Logic

Define and confirm:

- Evaluation inputs
- Normalized record structure
- Failure taxonomy
- Evaluation rubric
- Required metrics
- Report format
- Recommendation approach

### Phase 2 — Production Log Alignment

- Confirm Better Stack production log access.
- Confirm the actual production log schema.
- Identify the relevant production log events.
- Map production fields to the normalized request record.
- Validate trace IDs, request IDs, tool calls, errors, retries, and latency.
- Preserve the existing simulator as a controlled testing source where useful.

### Phase 3 — Failure Detection Validation

- Apply the agreed failure taxonomy to production logs.
- Create/use the reference labeled dataset.
- Run automated failure classification.
- Compare automated classifications with reference labels.
- Measure classification agreement.
- Refine detection rules where necessary.

### Phase 4 — Metrics & Scoring

Calculate:

- Total Requests
- Success Rate
- Top Failure
- Average Latency
- Worst Prompt
- Most-Failed Agent
- Failure distribution where supported
- Evaluation scores based on the agreed rubric

### Phase 5 — Report Automation

Generate the agreed evaluation report containing:

- Total Requests
- Success Rate
- Top Failure
- Average Latency
- Worst Prompt
- Most-Failed Agent
- Recommendations

The report should be generated automatically from the evaluation results.

### Phase 6 — API Integration

Expose the evaluation results through a stable API contract for the dashboard.

The API should return only data that has been calculated or generated by the backend.

### Phase 7 — Dashboard

Build the frontend using the backend API as the source of truth.

The dashboard should visualize the available evaluation results and clearly communicate failures, performance, and agent-level insights.

### Phase 8 — End-to-End Testing

Validate:

```text
Evaluation Input
        ↓
Production / Test Logs
        ↓
Parsing
        ↓
Failure Detection
        ↓
Metrics & Scoring
        ↓
Report
        ↓
API
        ↓
Dashboard
```

The test should verify that information is preserved correctly across each stage.

### Phase 9 — Stakeholder Demo

Demonstrate the complete evaluation flow and present:

- Evaluation methodology
- Key metrics
- Major failure patterns
- Agent-level findings
- Recommendations
- Final dashboard
- Generated report

---

## 16. Validation Criteria

The final system should satisfy the following:

- Logs can be ingested with minimal manual transformation.
- Required fields are extracted correctly.
- Normalized records preserve the required execution information.
- Failures are classified consistently against the agreed taxonomy.
- Automated classifications can be validated against reference labels.
- Evaluation metrics are calculated automatically.
- The scoring method follows the agreed evaluation rubric.
- Reports match the agreed output format.
- Recommendations are based on observed results.
- Dashboard values match backend results.
- The complete pipeline can run end-to-end.
- Findings can be explained clearly to stakeholders.

---

## 17. Current Implementation Boundary

The current prototype should be treated as an implementation foundation, not as the final production implementation.

The following are already validated in the prototype:

- Modular backend architecture
- FastAPI API
- Log parsing pipeline
- Failure detection framework
- Metrics calculation
- Report generation
- Rule-based evaluation scenarios
- Configuration
- Structured logging
- Core unit tests

The remaining production-alignment work should focus on:

- Actual Better Stack log schema
- Production log ingestion
- Complete agreed failure taxonomy
- Reference-label validation
- Final scoring methodology
- Recommendations
- Final report/API contract
- End-to-end validation
- Dashboard integration

---

## 18. Important Design Principles

### 18.1 Do not assume the production log schema

The actual Better Stack schema is the source of truth for production parsing.

### 18.2 Do not invent evaluation results

Every metric shown by the dashboard must originate from the backend evaluation pipeline.

### 18.3 Do not invent scoring weights

The scoring formula must follow the agreed evaluation rubric.

### 18.4 Keep simulation separate from production ingestion

The simulator can remain useful for deterministic testing, but it should not be presented as equivalent to production log ingestion.

### 18.5 Keep evaluation logic in the backend

The frontend should remain a presentation and interaction layer.

### 18.6 Validate before declaring the pipeline production-ready

Parser correctness, failure classification, metrics, scoring, and report generation should each be validated before the final end-to-end demo.

---

## 19. Final Target Architecture

```text
                         ┌──────────────────────┐
                         │   Evaluation Input   │
                         │ Prompt / Task /      │
                         │ Evaluation Context   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Log Ingestion     │
                         │ Better Stack / Logs  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Parser         │
                         │ Normalize Events     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Failure Detection   │
                         │ Taxonomy + Rules     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Metrics & Scoring    │
                         │ Performance + Eval  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Report Generation   │
                         │ Metrics + Findings   │
                         │ + Recommendations    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │ Evaluation Results   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Dashboard       │
                         │ KPIs + Charts +      │
                         │ Failure Insights     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Stakeholder Demo     │
                         │ Findings + Actions   │
                         └──────────────────────┘
```

---

## 20. Final Handoff Principle

The implementation should proceed only after the evaluation logic and production data assumptions are aligned.

The intended sequence is:

```text
Confirm Logic
      ↓
Confirm Production Log Schema
      ↓
Implement / Align Backend
      ↓
Validate Evaluation Results
      ↓
Finalize API Contract
      ↓
Build Dashboard
      ↓
Run End-to-End Tests
      ↓
Stakeholder Demo
```

This prevents frontend development or backend implementation from being based on assumptions that may later change.
