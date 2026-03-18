import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIdType } from './create-id-type';

const ExampleId = createIdType<'ExampleId'>('ExampleId');

describe('createIdType', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates ids in prefix_uuid format', () => {
    const value = ExampleId.generate();

    expect(value).toMatch(
      /^ExampleId_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('throws a clear error when the id value is missing', () => {
    expect(() => ExampleId.of(undefined as unknown as string)).toThrow(
      'ID for ExampleId must be a string',
    );
  });

  it('warns when the value is not in prefix_uuid format', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(ExampleId.of('ExampleId_legacy-id')).toBe('ExampleId_legacy-id');
    expect(warnSpy).toHaveBeenCalledWith(
      'ID ExampleId_legacy-id is not in expected "Prefix_uuid" format',
    );

    warnSpy.mockRestore();
  });

  it('accepts cross-module prefixed uuid values but preserves a prefix mismatch warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const foreignId = 'GuestIdentity_550e8400-e29b-41d4-a716-446655440000';

    expect(ExampleId.of(foreignId)).toBe(foreignId);
    expect(warnSpy).toHaveBeenCalledWith(
      'ID GuestIdentity_550e8400-e29b-41d4-a716-446655440000 does not start with expected prefix ExampleId',
    );

    warnSpy.mockRestore();
  });

  it('exposes a strict shape check helper', () => {
    expect(ExampleId.is('ExampleId_550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(ExampleId.is('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    expect(ExampleId.is(null)).toBe(false);
  });
});
