/**
 * App-react session product time facade (ADR-037 P1/P2).
 * Single session — Screens must not createTimeFacade for routine display.
 */
import {
  createTimeFacade,
  resolveEmptyLabel,
  type TimeFacade,
  type PartialTimeStyle,
  type TimeEmptyKind,
  type ResolveEmptyLabelOptions,
} from '@memoflow/time';

let sessionTime: TimeFacade = createTimeFacade({
  style: {
    locale: 'en-US',
    empty: {
      display: resolveEmptyLabel('emdash'),
      unknown: resolveEmptyLabel('unknown'),
    },
  },
});

export function getProductTime(): TimeFacade {
  return sessionTime;
}

export function setProductTimeStyle(partial: PartialTimeStyle): TimeFacade {
  sessionTime = sessionTime.withStyle(partial);
  return sessionTime;
}

export function emptyKind(
  kind: TimeEmptyKind,
  options?: ResolveEmptyLabelOptions,
): string {
  return resolveEmptyLabel(kind, options);
}

function toMs(value: number | string | Date | null | undefined): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Empty-safe date via session (optional empty override string). */
export function formatProductDate(
  value: number | string | Date | null | undefined,
  empty?: string,
): string {
  const ms = toMs(value);
  if (ms == null) return empty ?? sessionTime.style.empty.display;
  return sessionTime.format.date(ms, empty != null ? { empty: { display: empty } } : undefined);
}

/** Empty-safe dateTime via session. */
export function formatProductDateTime(
  value: number | string | Date | null | undefined,
  empty?: string,
): string {
  const ms = toMs(value);
  if (ms == null) return empty ?? sessionTime.style.empty.display;
  return sessionTime.format.dateTime(ms, empty != null ? { empty: { display: empty } } : undefined);
}

/** Relative product time via session facade. */
export function formatProductRelative(
  value: number | null | undefined,
  empty?: string,
): string {
  if (value == null || !Number.isFinite(value)) {
    return empty ?? sessionTime.style.empty.display;
  }
  return sessionTime.format.relative(value);
}

export { resolveEmptyLabel };
export type { TimeEmptyKind, PartialTimeStyle, TimeFacade };
