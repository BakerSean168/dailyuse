# Governance tools

## Package-Internal Boundary: `@memoflow/database`

`package-internal-boundary-audit.mjs` is the fail-closed gate: `server/domain` and
`server/application` production code must not import `@memoflow/database` or any of its
exported subpaths (e.g. `@memoflow/database/prisma`). Application/Domain consume Port only;
Prisma concrete code (exposed through `@memoflow/database`) belongs to Infrastructure. DB
deps are allowed only in `server/infrastructure`, host runtime composers
(`apps/*/src/runtime`) and test fixtures (`.spec.ts` / `.test.ts` / `__tests__`).

`server/domain` 与 `server/application` 的生产代码禁止 import `@memoflow/database` 及其所有
导出的子路径（如 `@memoflow/database/prisma`）。Application/Domain 只消费 Port；Prisma
具体实现（经 `@memoflow/database` 暴露）属于 Infrastructure。DB 依赖只允许出现在
`server/infrastructure`、宿主 runtime composer（`apps/*/src/runtime`）与测试
fixture（`.spec.ts` / `.test.ts` / `__tests__`）中。

The check lives in `lib/package-internal-boundary.mjs` (pure function, shared with the
CLI and unit tests); the rule set is defined in `package-internal-boundary-audit.mjs`.

The matcher covers `from '…'`, bare side-effect `import '…'`, `import type … from '…'` and
dynamic `import('…')`. Comment-interleaved forms (e.g. `import /* x */ '@memoflow/database'`)
are not matched — keep imports in the canonical forms above.

匹配器覆盖 `from '…'`、裸副作用 `import '…'`、`import type … from '…'` 与动态
`import('…')`。注释穿插形式（如 `import /* x */ '@memoflow/database'`）不会被匹配——请保持
导入使用上述规范形式。

## Dual Registry

- **Machine source of truth**: [`dual-registry.json`](./dual-registry.json)
- **Human summary**: [`../../docs/governance/dual-registry.md`](../../docs/governance/dual-registry.md)

Each `*dual*.surface.spec.ts` and `*keep-boundary*.spec.ts` is classified as:

| class | meaning |
|-------|---------|
| `retired` | dual implementation removed; surface is a lock (asset) |
| `keep_boundary` | intentional semantic boundary; do not force-merge |
| `open_S` / `open_M` / `open_X` | real dual debt (S/M fixable; X → product plan) |

Regenerate after dual surface moves:

```bash
# from repo root (script embedded in elegance residual; or re-run classifier)
node -e "console.log('see docs/governance/dual-registry.md')"
```

E3b tax cut may merge many `*-dual.surface.spec.ts` in one directory into `dual-registry.surface.spec.ts` (table/describe suite). Locks must be preserved.
