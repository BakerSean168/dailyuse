import { describe, expect, it } from 'vitest';
import { toRecord, toStringArray } from './projection-helpers';

describe('projection helpers', () => {
  it('toRecord parses JSON objects and rejects non-objects with undefined', () => {
    expect(toRecord({ a: 1 })).toEqual({ a: 1 });
    expect(toRecord('{"a":1}')).toEqual({ a: 1 });
    expect(toRecord(null)).toBeUndefined();
    expect(toRecord(undefined)).toBeUndefined();
    expect(toRecord('plain')).toBeUndefined();
    expect(toRecord([])).toBeUndefined();
    expect(toRecord('[1,2]')).toBeUndefined();
  });

  it('toStringArray parses JSON arrays and keeps only string entries', () => {
    expect(toStringArray(['a', '', 'b', 1])).toEqual(['a', '', 'b']);
    expect(toStringArray('["x","", "y"]')).toEqual(['x', '', 'y']);
    expect(toStringArray(null)).toEqual([]);
  });
});
