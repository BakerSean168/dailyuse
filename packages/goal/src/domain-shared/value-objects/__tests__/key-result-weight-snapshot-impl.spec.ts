import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { KeyResultWeightSnapshot } from '../key-result-weight-snapshot-impl';

describe('key-result-weight-snapshot-impl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serializes dto formats and computes derived values', () => {
    const snapshot = new KeyResultWeightSnapshot(
      'snapshot-1',
      'goal-1',
      'kr-1',
      'identity-1',
      20,
      35,
      Date.UTC(2026, 3, 25, 0, 0, 0),
      'Manual',
      'identity-2',
      'raise priority',
      Date.UTC(2026, 3, 25, 1, 0, 0),
    );

    expect(snapshot.weightDelta).toBe(15);
    expect(snapshot.toDTO()).toMatchObject({
      id: 'snapshot-1',
      oldWeight: 20,
      newWeight: 35,
      weightDelta: 15,
      reason: 'raise priority',
    });
    expect(KeyResultWeightSnapshot.fromDTO(snapshot.toDTO()).toDTO()).toEqual(snapshot.toDTO());
    expect(
      KeyResultWeightSnapshot.fromPersistenceDTO(snapshot.toPersistenceDTO()).toDTO(),
    ).toEqual(snapshot.toDTO());
  });

  it('validates weight boundaries', () => {
    expect(
      () =>
        new KeyResultWeightSnapshot(
          'snapshot-1',
          'goal-1',
          'kr-1',
          'identity-1',
          -1,
          20,
          Date.UTC(2026, 3, 25, 0, 0, 0),
          'Manual',
          'identity-2',
        ),
    ).toThrow('oldWeight');
    expect(
      () =>
        new KeyResultWeightSnapshot(
          'snapshot-1',
          'goal-1',
          'kr-1',
          'identity-1',
          20,
          101,
          Date.UTC(2026, 3, 25, 0, 0, 0),
          'Manual',
          'identity-2',
        ),
    ).toThrow('newWeight');
  });
});
