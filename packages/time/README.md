# `@memoflow/time`

Product time facade for MemoFlow (ADR-037).

## Role

| Layer | Responsibility |
|-------|----------------|
| **This package** | Clock · TimeStyle · Codec · Format · Input · Calendar |
| **Engine** (`src/engine/**`) | Only place that imports `date-fns` |
| **Contracts primitives** | Brand types: `Instant` ≡ `TransferDate`, `Ymd`, `Hm` |

Business and UI **must not** import `date-fns` or maintain private `formatDate` / `formatTime` helpers.

## Quick start

```ts
import { createTimeFacade, createFixedClock } from '@memoflow/time';

const time = createTimeFacade({
  clock: createFixedClock(Date.UTC(2026, 6, 26, 12, 0, 0)),
  style: { locale: 'zh-CN', empty: { display: '—' } },
});

time.format.hm(null);           // '—' from TimeStyle.empty.display
time.format.hm(time.now());     // 'HH:mm' via Style
time.codec.fromTransfer(NaN);   // null — never Date.now()
time.codec.parseYmd('2026-07-26');
```

## Docs

- Constitution: `docs/architecture/adr/ADR-037-product-time-system.md`
- Design: `docs/architecture/product-time-system.md`
- Style knobs for product/design: [`TIME_STYLE.md`](./TIME_STYLE.md)
- Registry: `tools/governance/time-registry.json`

## Nx

```bash
pnpm nx run time:test
pnpm nx run time:build
pnpm nx run time:typecheck
```
