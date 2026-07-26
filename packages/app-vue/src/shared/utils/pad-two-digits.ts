/**
 * Residual 1312: padTwoDigits dual-retired sole — re-exported from @dailyuse/time (ADR-037).
 * Residual 1318: multi-sole pad composition lives in @dailyuse/time format/engine.
 * Residual 1321: toLocalDateKey composes padTwoDigits via this re-export path.
 * Implementation lives in the product time facade; this path keeps dual-registry
 * surface locks and relative imports stable during migration.
 */
export { padTwoDigits } from '@dailyuse/time';
