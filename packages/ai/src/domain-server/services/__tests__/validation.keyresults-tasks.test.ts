import { describe, it, expect } from 'vitest';
import { AIGenerationValidationService } from '../AIGenerationValidationService';
import { AIValidationError } from '../../errors/AIErrors';

const service = new AIGenerationValidationService();

describe('AIGenerationValidationService.validateKeyResultsOutput', () => {
  function makeKR(overrides: Partial<any> = {}) {
    return {
      title: 'Improve Quality',
      valueType: 'INCREMENTAL',
      targetValue: 10,
      currentValue: 0,
      unit: 'bugs',
      weight: 50,
      aggregationMethod: 'LAST',
      ...overrides,
    };
  }

  it('passes valid 3-5 key results with total weight ≈100', () => {
    const krs = [makeKR({ weight: 30 }), makeKR({ weight: 35 }), makeKR({ weight: 35 })];
    expect(() => service.validateKeyResultsOutput(krs)).not.toThrow();
  });

  it('rejects wrong count (<3)', () => {
    const krs = [makeKR(), makeKR()];
    expect(() => service.validateKeyResultsOutput(krs)).toThrow(AIValidationError);
  });

  it('rejects wrong count (>5)', () => {
    const krs = Array.from({ length: 6 }, () => makeKR());
    expect(() => service.validateKeyResultsOutput(krs)).toThrow(AIValidationError);
  });

  it('rejects invalid weight sum', () => {
    const krs = [makeKR({ weight: 10 }), makeKR({ weight: 10 }), makeKR({ weight: 10 })];
    expect(() => service.validateKeyResultsOutput(krs)).toThrow(AIValidationError);
  });

  it('rejects KR with short title', () => {
    const krs = [
      makeKR({ title: 'abc', weight: 50 }),
      makeKR({ weight: 30 }),
      makeKR({ weight: 20 }),
    ];
    expect(() => service.validateKeyResultsOutput(krs)).toThrow(AIValidationError);
  });
});

describe('AIGenerationValidationService.validateTasksOutput', () => {
  function makeTask(overrides: Partial<any> = {}) {
    return {
      title: 'Research requirements',
      description: 'A'.repeat(60),
      estimatedHours: 8,
      priority: 'HIGH',
      dependencies: [],
      ...overrides,
    };
  }

  it('passes valid 5-10 tasks', () => {
    const tasks = Array.from({ length: 5 }, () => makeTask());
    expect(() => service.validateTasksOutput(tasks)).not.toThrow();
  });

  it('rejects wrong task count (<5)', () => {
    const tasks = Array.from({ length: 3 }, () => makeTask());
    expect(() => service.validateTasksOutput(tasks)).toThrow(AIValidationError);
  });

  it('rejects title not starting with capitalized verb', () => {
    const tasks = [
      makeTask({ title: 'invalid title' }),
      ...Array.from({ length: 4 }, () => makeTask()),
    ];
    expect(() => service.validateTasksOutput(tasks)).toThrow(AIValidationError);
  });

  it('rejects estimatedHours out of range', () => {
    const tasks = [
      makeTask({ estimatedHours: 50 }),
      ...Array.from({ length: 4 }, () => makeTask()),
    ];
    expect(() => service.validateTasksOutput(tasks)).toThrow(AIValidationError);
  });

  it('rejects invalid priority', () => {
    const tasks = [
      makeTask({ priority: 'INVALID' }),
      ...Array.from({ length: 4 }, () => makeTask()),
    ];
    expect(() => service.validateTasksOutput(tasks)).toThrow(AIValidationError);
  });

  it('rejects invalid dependency index', () => {
    const tasks = [
      makeTask({ dependencies: [999] }),
      ...Array.from({ length: 4 }, () => makeTask()),
    ];
    expect(() => service.validateTasksOutput(tasks)).toThrow(AIValidationError);
  });
});
