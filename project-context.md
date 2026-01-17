# DailyUse Project Context

> **CRITICAL INSTRUCTION FOR AGENTS:**
> The source of truth for project standards has moved.
> Please refer to the **[Standards Library](docs/standards/index.md)** for detailed rules.

##  Quick Access
- [Architecture](docs/standards/architecture.md)
- [Project Structure](docs/standards/structure.md)
- [Naming Conventions](docs/standards/naming.md)
- [Patterns & Rules](docs/standards/patterns.md)
- [Tech Stack](docs/standards/tech-stack.md)

##  ZERO-COMPROMISE RULES (Summary)
1. **Types**: Shared types MUST reside in \@dailyuse/contracts\.
2. **API**: Response format MUST be \{ ok: boolean, data?: T, error?: string }\.
3. **Isolation**: \packages/domain-*\ MUST NOT import from \packages/infrastructure-*\.
