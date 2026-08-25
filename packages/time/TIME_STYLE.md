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

## Third-party conversion boundaries (TIME-1101)

`Instant / Ymd / Hm` remain the only product time vocabulary. Third-party date types are adapter-only:

- the internal UI adapter converts `Ymd/Hm` to and from `@internationalized/date` `CalendarDate/Time` values; TIME-1101 intentionally does not add a new public package subpath.
- recurrence consumers use MemoFlow-owned `RecurrenceSchedule` / `RecurrenceEnginePort`; `rrule` types stop inside the recurrence adapter.
- feature contracts under `@memoflow/contracts` must not import `rrule`, `ical.js`, or `@internationalized/date`.
- recurrence receives a resolved IANA zone through the time boundary; code that means “current local zone” resolves it through `TimeZoneSource` rather than reading host timezone ad hoc inside recurrence math.

The conformance suite includes Tokyo plus New York spring/fall DST transitions. Temporal is not a second product time model; if adopted later, it belongs at a dedicated adapter edge only.
