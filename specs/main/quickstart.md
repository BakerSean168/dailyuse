# Quickstart: Contracts Baseline

## Goal
Define base RPC/event maps and API schemas for each module under packages/contracts.

## Steps
1. For each module in packages/contracts/src/modules/*, ensure the following folders exist: protocol/, api/, dtos/.
2. In protocol/, define:
   - `<module>-rpc-map.ts` mapping event keys to request/response types from api.
   - `<module>-event-map.ts` for domain events (if used).
3. In api/, define request/response schemas using zod and export the inferred types.
4. In dtos/, define composed response types used by API schemas and RPC maps.
5. Keep RPC request/response types aligned to API schema types; do not duplicate shapes in protocol.

## Example (Authentication)
- protocol/auth-rpc-map.ts uses `LoginByEmailReq` and `LoginByEmailRes` from api.
- api/login.ts defines zod schemas and types.
- dtos/auth-response.dto.ts composes identity/session payloads.

## Validation
- Types are referenced across layers without duplication.
- New contract entries are listed in [specs/main/contracts/rpc-events.openapi.yaml](specs/main/contracts/rpc-events.openapi.yaml).
