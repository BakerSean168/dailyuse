# Feature: Define base contracts for RPC/events across all modules

## Background
User wants to standardize the contracts package so that each module defines base RPC/event contracts in protocol, and API schemas in api, with DTOs for composed/complex response types. The auth module is the reference example.

## User Stories

### US1: Standardize contracts across all modules (Priority: P1)
- As a developer, I want all 13 modules to follow a consistent contract structure (protocol → api → dtos) so that RPC/event integration is predictable and maintainable.
- Acceptance Criteria:
  - Every module has protocol/, api/, dtos/ folders with consistent structure.
  - RPC/event maps in protocol reference API schema types (no inline shapes).
  - Complex composed responses are defined in DTOs.
  - All changes compile and typecheck successfully.

## Requirements
- Define base RPC/event contracts for all modules in packages/contracts.
- Ensure RPC request/response types align with API schemas (request/response should refer to API schema types).
- Complex composed response types should live in DTOs.
- Provide a clear module organization: protocol (RPC/event map), api (schemas and request/response types), dtos (composed types).
- Document module event key naming conventions and contract layering rules.
- Inventory and confirm all modules have protocol/api/dtos folders.

## Non-Functional Requirements
- **Backward Compatibility**: Keep existing contract shapes stable; introduce changes incrementally to avoid breaking downstream consumers.
- **Validation**: Zod schemas in api layer enforce request/response validation.
- **Tree-Shaking**: Subpath exports in packages.json/package.json allow consumers to import only module-level contracts.
- **Documentation**: Each module contract set is discoverable and cross-referenced in README and registry.

## Edge Cases
- **Modules without events**: Some modules may only have RPC maps; event maps can be minimal or omitted if no domain events exist.
- **Shared DTOs**: Some DTOs may be used across modules (e.g., common response wrappers); these should be referenced or re-exported appropriately.
- **Validation inheritance**: API schema types may extend shared base types; ensure zod composition is clear.

## Non-Goals
- Implement business logic or runtime handlers.
- Modify API behavior beyond contract definitions.

## Acceptance Criteria
- Documentation artifacts describe the standardized structure and relationships between protocol, api, and dtos.
- Contracts are represented consistently for all modules.
