<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- All Nx commands must use the `pnpm nx ...` form, for example `pnpm nx serve desktop`.
- When running tasks such as build, lint, test, or e2e, always prefer Nx commands like `nx run`, `nx run-many`, and `nx affected` over calling the underlying tools directly.
- Use the Nx MCP tools when they help answer repository, project, or configuration questions.
- For repository-level questions, inspect the workspace with `nx_workspace` first when applicable.
- For project-specific work, inspect the project with `nx_project_details` first.
- For Nx configuration, best practices, or uncertainty, use `nx_docs` instead of guessing.
- For Nx configuration or project graph errors, use `nx_workspace` to surface the actual workspace errors first.
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md` when it exists.

<!-- nx configuration end-->

# Change Policy

- The project is in active development; backward compatibility is not required.
- No data migration path is needed.
- Prefer direct root-cause fixes over patches, fallbacks, shims, or transitional code.
- When a cleaner structural refactor is feasible, prefer it over a narrow local fix.
- Keep implementations simple, explicit, and easy to understand.

desktop 端开发模式下的日志路径： "C:\Users\xx\AppData\Roaming\Memoflow-Dev\logs"