import { describe, expect, it } from 'vitest';
import { formatProductHm } from './product-time';

describe('formatProductHm', () => {
  it('normalizes epoch, ISO string, and Date inputs through the same time facade', () => {
    const epoch = Date.parse('2026-08-01T09:30:00.000Z');

    expect(formatProductHm(new Date(epoch))).toBe(formatProductHm(epoch));
    expect(formatProductHm(new Date(epoch).toISOString())).toBe(formatProductHm(epoch));
  });

  it('uses the empty label for invalid values', () => {
    expect(formatProductHm('not-a-date', 'empty')).toBe('empty');
  });
});
