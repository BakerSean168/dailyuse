# FullCalendar Standard Planner PoC (PLAN-4301)

This is an isolated engineering PoC. It is intentionally **not** wired into the production Planner route.

## Decision

**GO** with FullCalendar Standard as the rendering/interaction candidate for the Planner migration. Keep MemoFlow ownership, projection, command routing, validation, and failed-mutation semantics outside FullCalendar.

The PoC uses only MIT Standard dependencies:

- `@fullcalendar/vue3@7.0.2`
- `temporal-polyfill@1.0.4` (required peer/runtime support for FullCalendar v7)

No Premium/Scheduler/resource plugin is installed or required.

## Covered

- Day (`timeGridDay`)
- Week TimeGrid (`timeGridWeek`)
- Month (`dayGridMonth`)
- List/Agenda (`listWeek`)
- custom MemoFlow event content
- now indicator
- selection callback
- per-event move/resize/read-only capabilities
- `eventDrop` / `eventResize` -> canonical PLAN-4303 owner command router
- owner failure/exception -> FullCalendar `revert()`
- narrow-panel presentation
- light/dark presentation
- semantic toolbar/grid/event accessibility smoke

The fixture mirrors the planned `CalendarEventProjection` boundary: source identity, date range, display metadata, editable capabilities, owner command target, and revision.

## Browser/build evidence

On the GCP development host, an isolated Vite production build measured approximately:

- build: 401 ms
- JavaScript: 396.64 kB raw / ~121.3 kB gzip (manual gzip measurement; Vite reported 122.58 kB)
- CSS: 5.92 kB raw / ~1.6 kB gzip

A real headless Chromium production-preview smoke measured:

- Vue PoC app mount marker: 119.3 ms
- first observed interactive Planner toolbar: 182.6 ms
- Day / Week / Month / List all switched successfully
- dark + narrow modes applied successfully
- custom event content rendered
- all observed buttons had accessible names
- no browser runtime error occurred

These figures are a local engineering baseline, not a product performance SLA.

## Drag/resize caveat

The deterministic adapter tests prove that FullCalendar `eventDrop` / `eventResize` callbacks route through the canonical source-aware owner command router and invoke the supplied `revert()` when the owner rejects or conflicts. Two raw Playwright pointer-gesture attempts in headless Chromium did **not** trigger FullCalendar's drag lifecycle, so this PoC does **not** claim browser-level pointer DnD E2E success.

Before deleting the current custom calendar during the production migration, PLAN-4304 should add a stable real-Planner drag/resize E2E (or a supported FullCalendar interaction harness) and verify both successful owner mutation and visual revert on failure.

## Comparison to current custom Planner

The current custom month/week renderers alone are roughly 436 lines (`MonthViewCalendar.vue` + `WeekViewCalendar.vue`) and MemoFlow still owns layout/date-grid behavior. Standard FullCalendar supplies the missing Day/List surfaces plus selection/drag/resize/now-indicator primitives behind one adapter. MemoFlow should continue owning business semantics rather than wrapping FullCalendar as a new domain authority.
