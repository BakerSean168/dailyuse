# Tech Stack & Constraints

## 1. Core Stack
- **Languages:** TypeScript, Node.js
- **Package Manager:** pnpm
- **Monorepo:** Nx / Turbo (implied)

## 2. Libraries & Frameworks
| Category | Technology | Constraint |
| --- | --- | --- |
| **ORM** | Prisma | Use only in `infrastructure-*` |
| **Backend** | NestJS / Express | Logic must stay in Domain/App layers |
| **Frontend** | React / Vue (Check repo) | Use Composition API / Hooks |
| **Styling** | Tailwind CSS | Avoid raw CSS/SCSS |
| **State** | React Query / Pinia | Prefer Server State over Global Store |

## 3. Testing
- **Framework:** Vitest / Jest
- **Rule:** Tests should be co-located or in `__tests__` folder.
