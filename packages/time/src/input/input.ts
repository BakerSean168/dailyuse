import type { Hm, Instant, Ymd } from '@memoflow/contracts/primitives';
import type { TimeCodec } from '../codec/codec';
import type { TimeEngine, TimeStyle } from '../types';
import { asInstant } from '../codec/brand';

export interface InputApi {
  dateValue(instantOrYmd: Instant | number | Ymd | string | null | undefined): string;
  timeValue(instant: Instant | number | null | undefined): string;
  parseDateValue(raw: string): Ymd | null;
  parseTimeValue(raw: string): Hm | null;
  combine(ymd: Ymd | string, hm: Hm | string): Instant | null;
}

export function createInput(
  style: TimeStyle,
  codec: TimeCodec,
  engine: TimeEngine,
): InputApi {
  return {
    dateValue(instantOrYmd) {
      if (instantOrYmd == null || instantOrYmd === '') return style.empty.input;
      if (typeof instantOrYmd === 'string') {
        return codec.parseYmd(instantOrYmd) ?? style.empty.input;
      }
      if (typeof instantOrYmd === 'number') {
        const i = codec.fromTransfer(instantOrYmd);
        if (i == null) return style.empty.input;
        return engine.toYmd(i);
      }
      return style.empty.input;
    },

    timeValue(instant) {
      if (instant == null) return style.empty.input;
      const i = codec.fromTransfer(instant as number);
      if (i == null) return style.empty.input;
      return engine.formatHm(i, 'HH:mm');
    },

    parseDateValue(raw) {
      return codec.parseYmd(raw);
    },

    parseTimeValue(raw) {
      return codec.parseHm(raw);
    },

    combine(ymd, hm) {
      const y = typeof ymd === 'string' ? codec.parseYmd(ymd) : ymd;
      const h = typeof hm === 'string' ? codec.parseHm(hm) : hm;
      if (y == null || h == null) return null;
      return codec.combineYmdHm(y, h);
    },
  };
}

/** @internal re-export for tree */
export { asInstant };
