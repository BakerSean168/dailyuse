# TimeStyle

Product/design knobs for human-visible time. Change **one** default (or session override) — list empty cells, relative cutoffs, and HM density follow.

## Key fields

| Path | Effect |
|------|--------|
| `empty.display` | `format.hm/date/dateTime/relative(null)` and list empty-time cells |
| `empty.input` | Form date/time empty string |
| `empty.unknown` | Unparseable display |
| `display.hm` | `format.hm` pattern (default `HH:mm`) |
| `display.date` / `dateTime` | Density: short / medium / long |
| `locale` | Intl + relative |
| `relative.maxAgeMs` | Beyond → absolute `dateTime` |
| `calendar.weekStartsOn` | Week grid / `startOfWeek` |

## Priority

```text
call-site override
  > facade.withStyle(partial)
    > session preference (W8)
      > DEFAULT_TIME_STYLE
```

## Demo: empty display

```ts
const time = createTimeFacade({ style: { empty: { display: '暂无' } } });
time.format.hm(null); // '暂无'
```

Domain code must **not** read UI locale for business rules; use Calendar/Clock policy only.
