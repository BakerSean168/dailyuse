# AI Service Architecture

## Layer Boundaries

```
app.py                    — App shell: lifespan, middleware, route registration
├── config/               — Settings, environment
├── middleware/            — Auth, request context
├── api/
│   ├── routes/           — HTTP endpoints (chat, health, workflows)
│   ├── dependencies.py   — FastAPI dependency injection
│   └── error_handlers.py — Exception mapping
├── orchestrator/         — Workflow dispatch layer
│   ├── orchestrator.py   — Registry + dispatch
│   ├── models.py         — Workflow request/response types
│   └── handlers/         — Per-domain workflow handlers
├── services/             — Business logic (LLM-powered)
│   ├── chat_service.py
│   ├── goal_planning_service.py
│   ├── knowledge_*.py
│   └── analytics_*.py
├── providers/            — LLM provider abstraction
│   ├── base.py           — Abstract provider interface
│   ├── openai_provider.py
│   └── anthropic_provider.py
├── schemas/              — Pydantic request/response models
├── security/             — Request signing
├── infrastructure/       — Shared HTTP client
└── evals/                — Evaluation harness (offline only)
    ├── runner.py
    └── goal_workflow_harness.py
```

## Rules

- `app.py` is the composition root. It wires services, handlers, and middleware. No business logic.
- `services/` contains LLM-powered business logic. Services depend on `providers/` and `schemas/`, not on `api/` or `orchestrator/`.
- `orchestrator/` dispatches workflow requests to handlers. Handlers depend on `services/`.
- `api/routes/` are thin HTTP adapters. They depend on `orchestrator/` and `services/` via FastAPI dependency injection.
- `providers/` abstract LLM API calls. No business logic.
- `evals/` is an offline evaluation harness. It imports from `services/` but is never imported by the running app.

## Large Files (Future Split Candidates)

- `services/goal_planning_service.py` (~1200 lines) — contains goal analysis, plan generation, and automation logic
- `evals/runner.py` (~1200 lines) — contains evaluation runner, metrics, and reporting

These are known large files but are not currently blocking architecture goals. Split them when they become modification hotspots.
