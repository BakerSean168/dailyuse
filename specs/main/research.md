# Research

## Decisions

### Contract layering
- Decision: Keep protocol (RPC/event maps), api (schema + req/res types), and dtos (composed response types) as distinct layers per module.
- Rationale: Matches existing authentication module structure and makes RPC request/response types reference API schemas, keeping validation close to request definitions while DTOs capture composed payloads.
- Alternatives considered: Putting RPC request/response directly in protocol without API schemas (rejected: loses validation alignment); placing composed DTOs in api (rejected: blurs responsibilities).

### Single login event with discriminated union
- Decision: Use a single login event/endpoint with discriminated union request types when multiple login methods exist.
- Rationale: Reduces event explosion, keeps a stable interface, and allows analytics/audit differentiation via `type` or `method`.
- Alternatives considered: Separate events per login method (rejected: duplication and harder evolution).

### Module baseline contract set
- Decision: Define a minimal baseline for each module: core RPC map + event map with request/response types referencing api schemas; DTOs only when composed.
- Rationale: Ensures consistency across 13 modules and keeps contracts easy to scan.
- Alternatives considered: Only per-module ad-hoc definitions (rejected: inconsistent patterns and harder client usage).
