# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DailyUse is a personal productivity management platform built as an Nx monorepo with three main applications:
- **apps/api** - Node.js Express backend with Prisma ORM
- **apps/web** - Vue 3 + Vuetify web frontend
- **apps/desktop** - Electron desktop app with React + shadcn/ui renderer

## Common Commands

```bash
# Development
pnpm dev              # Start API + Web in parallel
pnpm dev:api          # API only (tsx watch)
pnpm dev:web          # Web only (Vite)
pnpm dev:desktop      # Electron desktop app

# Building
pnpm build            # Build all projects
pnpm nx build <app>   # Build specific app (api, web, desktop)
pnpm build:affected   # Build only affected projects

# Testing (Vitest workspace)
pnpm test             # Run all tests
pnpm nx test <project>  # Test specific project
pnpm test:ui          # Vitest UI mode
pnpm test:coverage    # With coverage report

# Database (Prisma)
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm db:push          # Push schema to database

# Docker (PostgreSQL)
pnpm docker:dev:up    # Start dev database
pnpm docker:test:up   # Start test database

# Code Quality
pnpm lint             # ESLint all projects
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Prettier formatting
pnpm typecheck        # TypeScript checking
```

## Architecture

### Domain-Driven Design Layers

The codebase follows DDD with clear separation:
- **packages/domain-server** - Server-side entities, value objects, repositories
- **packages/domain-client** - Client-side business logic (Pinia stores)
- **packages/domain-shared** - Shared domain models
- **packages/application-server** - Server application services/use cases
- **packages/application-client** - Client application services
- **packages/infrastructure-server** - Data access (Prisma + PostgreSQL)
- **packages/contracts** - TypeScript interfaces and Zod schemas

### Package Import Patterns

```typescript
// Type contracts (Zod schemas)
import { Task, User } from '@dailyuse/contracts';

// Client business logic
import { useTaskStore } from '@dailyuse/domain-client';

// Server domain
import { TaskEntity } from '@dailyuse/domain-server';

// Shared utilities
import { logger } from '@dailyuse/utils';

// UI components
import { Button } from '@dailyuse/ui-vuetify';  // Vue
import { Button } from '@dailyuse/ui-react-shadcn';   // React
```

### Key Path Aliases (tsconfig.base.json)
- `@dailyuse/*` - packages/*
- `@api/shared` - apps/api/src/shared

## Database

- **ORM**: Prisma 7.x
- **Schema**: `packages/infrastructure-server/prisma/schema.prisma`
- **Generated Client**: `packages/infrastructure-server/src/generated/prisma`
- **Database**: PostgreSQL (Docker for dev/test)

## Testing

Vitest workspace with environment-specific configurations:
- **API tests**: Node environment, forked pools, 30s timeout
- **Web tests**: happy-dom, Vue support
- **Desktop tests**: happy-dom, React
- **Domain tests**: forked pools for isolation

## Technology Stack

- **Runtime**: Node.js 22+, pnpm 10.x
- **Build**: Nx 22.x, Vite, tsup (API)
- **Languages**: TypeScript 5.9 (strict mode)
- **Validation**: Zod 4.x
- **Frontend**: Vue 3.4 + Vuetify (web), React + shadcn/ui (desktop)
- **Desktop**: Electron 39.x

## Git Workflow

- **main**: Production releases
- **dev**: Development integration
- **feature/***: Feature branches (PR to dev)
- Conventional commits required (feat:, fix:, docs:, etc.)
