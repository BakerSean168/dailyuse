import type { Instant } from '@dailyuse/contracts/primitives';
import type {
  Clock,
  PartialTimeStyle,
  TimeEngine,
  TimeStyle,
} from './types';
import { DEFAULT_TIME_STYLE, mergeTimeStyle } from './style/default-style';
import { createSystemClock } from './clock/system-clock';
import { createFixedClock } from './clock/fixed-clock';
import { createDateFnsEngine } from './engine/date-fns-engine';
import { createCodec, type TimeCodec } from './codec/codec';
import { createFormat, type FormatApi } from './format/format';
import { createInput, type InputApi } from './input/input';
import { createCalendar, type CalendarApi } from './calendar/calendar';

export interface TimeFacadeOptions {
  style?: PartialTimeStyle | TimeStyle;
  clock?: Clock;
  engine?: TimeEngine;
}

export interface TimeFacade {
  readonly style: TimeStyle;
  readonly clock: Clock;
  readonly codec: TimeCodec;
  readonly format: FormatApi;
  readonly input: InputApi;
  readonly calendar: CalendarApi;
  readonly engine: TimeEngine;
  now(): Instant;
  withStyle(partial: PartialTimeStyle): TimeFacade;
  withClock(clock: Clock): TimeFacade;
  /** Engine adapter seam (P11) — swap DateFnsEngine / Temporal / test double. */
  withEngine(engine: TimeEngine): TimeFacade;
}

export function createTimeFacade(options: TimeFacadeOptions = {}): TimeFacade {
  const style = mergeTimeStyle(
    DEFAULT_TIME_STYLE,
    options.style as PartialTimeStyle | undefined,
  );
  const clock = options.clock ?? createSystemClock();
  const engine = options.engine ?? createDateFnsEngine();
  const codec = createCodec(engine, style);
  const format = createFormat(style, engine, clock);
  const input = createInput(style, codec, engine);
  const calendar = createCalendar(style, engine, clock);

  const facade: TimeFacade = {
    style,
    clock,
    codec,
    format,
    input,
    calendar,
    engine,
    now() {
      return clock.now();
    },
    withStyle(partial) {
      return createTimeFacade({
        style: mergeTimeStyle(style, partial),
        clock,
        engine,
      });
    },
    withClock(nextClock) {
      return createTimeFacade({ style, clock: nextClock, engine });
    },
    withEngine(nextEngine) {
      return createTimeFacade({ style, clock, engine: nextEngine });
    },
  };

  return facade;
}

/** Default app-wide facade (system clock + default style). Prefer inject in apps. */
export const defaultTime = createTimeFacade();

export { createSystemClock, createFixedClock, DEFAULT_TIME_STYLE, mergeTimeStyle };
