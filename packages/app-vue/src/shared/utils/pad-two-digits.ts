/**
 * Residual 1312: padTwoDigits dual-retired sole — re-exported from @memoflow/time (ADR-037).
 * Residual 1318: multi-sole pad composition lives in @memoflow/time format/engine.
 * Residual 1321: toLocalDateKey composes padTwoDigits via this re-export path.
 * Implementation lives in the product time facade; this path keeps dual-registry
 * surface locks and relative imports stable during migration.
 */
export { padTwoDigits } from '@memoflow/time';
