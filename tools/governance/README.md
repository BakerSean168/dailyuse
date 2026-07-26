# Governance tools

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
