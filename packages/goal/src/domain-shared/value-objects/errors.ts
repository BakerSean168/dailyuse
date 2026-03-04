/**
 * Domain errors for Goal value objects
 */

import { DomainError } from '@dailyuse/utils';

export class InvalidWeightError extends DomainError {
  constructor(field: string, value: number) {
    super(
      'VALIDATION_ERROR',
      `Invalid weight value for ${field}: ${value}. Must be between 0 and 100.`,
      { field, value },
      422,
    );
  }
}
