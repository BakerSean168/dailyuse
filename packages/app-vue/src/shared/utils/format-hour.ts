/**
 * Residual 1276: sole formatHour — re-exported from @dailyuse/time (ADR-037 W2).
 * Residual 1318: padTwoDigits composition lives in @dailyuse/time engine/format.
 * Soft residual: :00 join contract is implemented in @dailyuse/time format.hourLabel.
 */
export { formatHour } from '@dailyuse/time';
