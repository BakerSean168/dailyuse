# Data Model

## Entities

### Module
- Fields: `name` (string), `path` (string)
- Relationships: has many `RpcEvent`, `ApiSchema`, `Dto`
- Notes: One module folder under packages/contracts/src/modules/*

### RpcEvent
- Fields: `key` (string), `requestType` (string), `responseType` (string), `kind` (rpc|event)
- Relationships: belongs to `Module`, references `ApiSchema` types
- Validation: `key` is namespaced (e.g., `auth:login`, `task:create`)

### ApiSchema
- Fields: `name` (string), `zodSchema` (string), `reqType` (string), `resType` (string)
- Relationships: belongs to `Module`, used by `RpcEvent`
- Validation: request/response types derived from schema and kept stable for compatibility

### Dto
- Fields: `name` (string), `fields` (object)
- Relationships: belongs to `Module`, may include aggregates from other module subfolders
- Validation: used only when composed payloads exceed simple API responses

## State/Transitions
- N/A (contracts are static definitions)
