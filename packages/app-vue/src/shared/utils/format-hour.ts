/**
 * Residual 1276: sole formatHour — re-exported from @memoflow/time (ADR-037 W2).
 * Residual 1318: padTwoDigits composition lives in @memoflow/time engine/format.
 * Soft residual: :00 join contract is implemented in @memoflow/time format.hourLabel.
 */
export { formatHour } from '@memoflow/time';
