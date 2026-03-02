/**
 * Domain errors for Goal value objects
 */

export class InvalidWeightError extends Error {
  constructor(field: string, value: number) {
    super(`Invalid weight value for ${field}: ${value}. Must be between 0 and 100.`);
    this.name = 'InvalidWeightError';
  }
}
