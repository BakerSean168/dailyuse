# File & Directory Structure

## 1. 📂 Project Structure Map

| Directory | Type | Purpose & Restrictions |
| --- | --- | --- |
| `apps/` | Deployable | **Entry points** (api, desktop, web). Glue code only. |
| `packages/contracts` | Shared | **The Holy Grail**. All shared types, DTOs, Enums. NO Logic. |
| `packages/domain-server` | Core | Pure business logic, Aggregates, Entities. **No dependencies on IO**. |
| `packages/domain-client` | Core | Frontend business logic, state shape. |
| `packages/application-server` | Service | Use Cases, Orchestration. Connects Domain to Infra interfaces. |
| `packages/application-client` | Service | Frontend Use Cases. |
| `packages/infrastructure-server` | Imp | **Dirty Work**. DB (Prisma), External APIs. Implements Domain interfaces. |
| `packages/infrastructure-client` | Imp | HTTP implementation (Axios/Fetch), Storage. |
| `packages/ui-*` | Presentation | Start Components. Dumb components. |

## 2. 🌲 Detailed Structure

```
d:\home\projects\dailyuse\
├── apps\                # Applications
│   ├── api\             # NestJS/Express API Entry point
│   └── web\             # React/Next.js Frontend Entry point
├── packages\            # Monorepo Packages
│   ├── contracts\       # [Constraint] No dependencies allowed
│   ├── domain-*\        # [Constraint] No infrastructure imports
│   └── infrastructure-*\ # [Constraint] Implementation details only
└── docs\
    └── standards\       # This documentation
```
