export type HostTaskCreateFailureKind = 'validation' | 'forbidden';

/** Structured host-task invariant failure; callers branch on kind, never message text. */
export class HostTaskCreateRuntimeError extends Error {
  constructor(
    readonly kind: HostTaskCreateFailureKind,
    message: string,
  ) {
    super(message);
    this.name = 'HostTaskCreateRuntimeError';
  }
}

export function hostTaskCreateValidationError(message: string): HostTaskCreateRuntimeError {
  return new HostTaskCreateRuntimeError('validation', message);
}

export function hostTaskCreateForbiddenError(message: string): HostTaskCreateRuntimeError {
  return new HostTaskCreateRuntimeError('forbidden', message);
}
