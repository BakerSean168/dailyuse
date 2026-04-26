import { describe, expect, it } from 'vitest';
import { IndexStatus } from '../index-status';

describe('IndexStatus', () => {
  it('validates status', () => {
    expect(IndexStatus.isValid('Indexed')).toBe(true);
    expect(IndexStatus.isValid('Invalid')).toBe(false);
  });

  it('creates status of valid value', () => {
    expect(IndexStatus.of('Indexing')).toBe('Indexing');
  });

  it('throws on invalid value', () => {
    expect(() => IndexStatus.of('Invalid')).toThrow();
  });

  it('gets all statuses', () => {
    expect(IndexStatus.getAll()).toEqual(['NotIndexed', 'Indexing', 'Indexed', 'Failed', 'Outdated']);
  });

  it('checks status type', () => {
    expect(IndexStatus.isIndexed(IndexStatus.Indexed)).toBe(true);
    expect(IndexStatus.isIndexed(IndexStatus.NotIndexed)).toBe(false);
    expect(IndexStatus.isIndexing(IndexStatus.Indexing)).toBe(true);
    expect(IndexStatus.isIndexing(IndexStatus.Indexed)).toBe(false);
    expect(IndexStatus.isError(IndexStatus.Failed)).toBe(true);
    expect(IndexStatus.isError(IndexStatus.Indexed)).toBe(false);
    expect(IndexStatus.needsIndexing(IndexStatus.NotIndexed)).toBe(true);
    expect(IndexStatus.needsIndexing(IndexStatus.Outdated)).toBe(true);
    expect(IndexStatus.needsIndexing(IndexStatus.Indexed)).toBe(false);
  });
});
