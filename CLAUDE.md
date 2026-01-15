<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# 代码规范 (CRITICAL)

**必须阅读并遵循**: [docs/standards/README.md](docs/standards/README.md)

核心要点：
- API 响应使用 `ok: boolean`，**禁止** `success: boolean` → [详细](docs/standards/api-response.md)
- 使用 `@dailyuse/contracts/result` 中的统一类型 (ActionResult, CountResult, etc.)
- 遵循 Clean Architecture 分层依赖 → [详细](docs/standards/architecture.md)
- 类型导入使用 `import type` → [详细](docs/standards/typescript.md)
- 禁止内联类型定义，必须使用 contracts 中的类型
