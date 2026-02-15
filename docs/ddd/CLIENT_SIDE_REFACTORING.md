# Client-Side DDD Refactoring Guide

## Overview

Client-side services follow similar DDD principles as server-side, but with framework-agnostic design.

## Architecture Pattern

### Application-Client Layer
**Purpose**: Framework-agnostic API client services that orchestrate HTTP calls

**Responsibilities**:
- Make HTTP API calls to backend
- Handle request/response transformation  
- Implement retry logic and error handling
- Manage optimistic updates (optional)
- NO business logic (belongs in domain-client or aggregates)

**Naming Convention**:
- Individual: `create-X.ts`, `update-X.ts`, `delete-X.ts`, `get-X.ts`, `list-X.ts`
- Monolithic (deprecated): `*-client-service.ts`

### Domain-Client Layer
**Purpose**: Client-side business logic and state management

**Responsibilities**:
- Client-side validation
- State management (Pinia for Vue, hooks for React)
- Business rules without server validation
- Derived state calculations

## Refactoring Status

✅ Reference: Governance, Account, Authentication
⚠️ Needs Work: Task, Goal, Schedule, Repository, Reminder, Setting, Notification

## Migration Strategy
1. Add deprecation notices ✅
2. Extract individual services
3. Update stores
4. Remove monolithic services
