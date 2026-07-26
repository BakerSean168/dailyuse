/**
 * Local calendar day key `YYYY-MM-DD` (product local calendar; default device TZ).
 *
 * Not an Instant and not a midnight Date. Birthday, all-day task start, calendar
 * cell keys, and similar calendar-day fields use this brand.
 */
export type Ymd = string & { readonly __brand: 'Ymd' };
