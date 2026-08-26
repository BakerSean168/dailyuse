import type { KeyResultCalculationMethod } from '@memoflow/contracts/goal';

export type KeyResultProgressDirection = 'increasing' | 'decreasing';

export interface KeyResultMeasurement {
  startingValue: number;
  currentValue: number;
  targetValue: number;
  progressBaselineValue: number | null;
  aggregationMethod: KeyResultCalculationMethod;
}

export interface KeyResultProgressCalculation {
  currentValue: number;
  percentage: number;
  direction: KeyResultProgressDirection;
  isCompleted: boolean;
}

/**
 * The single arithmetic authority for KR Measurement V2.
 *
 * When `recordValues` is supplied, currentValue is first derived from the
 * configured aggregation. When it is omitted, the measurement's currentValue
 * is treated as the authoritative already-aggregated fact.
 */
export function calculateKeyResultProgress(
  measurement: KeyResultMeasurement,
  recordValues?: readonly number[],
): KeyResultProgressCalculation {
  validateMeasurement(measurement);
  const currentValue =
    recordValues === undefined
      ? measurement.currentValue
      : aggregateRecords(measurement.startingValue, measurement.aggregationMethod, recordValues);

  if (!Number.isFinite(currentValue)) throw new Error('currentValue must be a finite number');

  const baseline = measurement.progressBaselineValue;
  if (baseline === null) {
    if (measurement.targetValue <= 0) {
      throw new Error('progressBaselineValue is required when targetValue is zero or negative');
    }
    if (measurement.targetValue < measurement.startingValue) {
      throw new Error('progressBaselineValue is required for a decreasing target');
    }
    return {
      currentValue,
      percentage: round(clamp((currentValue / measurement.targetValue) * 100)),
      direction: 'increasing',
      isCompleted: currentValue >= measurement.targetValue,
    };
  }

  const span = measurement.targetValue - baseline;
  if (span === 0) throw new Error('progressBaselineValue must differ from targetValue');
  const direction: KeyResultProgressDirection = span > 0 ? 'increasing' : 'decreasing';
  const ratio = (currentValue - baseline) / span;
  return {
    currentValue,
    percentage: round(clamp(ratio * 100)),
    direction,
    isCompleted:
      direction === 'increasing'
        ? currentValue >= measurement.targetValue
        : currentValue <= measurement.targetValue,
  };
}

function aggregateRecords(
  startingValue: number,
  method: KeyResultCalculationMethod,
  values: readonly number[],
): number {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('record values must be finite numbers');
  }
  if (method === 'Sum') return startingValue + values.reduce((sum, value) => sum + value, 0);
  if (values.length === 0) return startingValue;
  switch (method) {
    case 'Average':
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case 'Max':
      return Math.max(...values);
    case 'Min':
      return Math.min(...values);
    case 'Last':
      return values[values.length - 1];
    default:
      return assertNever(method);
  }
}

function validateMeasurement(measurement: KeyResultMeasurement): void {
  for (const [name, value] of [
    ['startingValue', measurement.startingValue],
    ['currentValue', measurement.currentValue],
    ['targetValue', measurement.targetValue],
  ] as const) {
    if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
  }
  if (
    measurement.progressBaselineValue !== null &&
    !Number.isFinite(measurement.progressBaselineValue)
  ) {
    throw new Error('progressBaselineValue must be a finite number');
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported aggregation method: ${String(value)}`);
}
