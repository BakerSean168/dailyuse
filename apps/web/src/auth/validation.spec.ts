import { describe, expect, it } from 'vitest';
import { firstInvalidField, validateLogin, validateRegistration } from './validation';

describe('web authentication validation', () => {
  it('returns every registration issue and preserves first-field order', () => {
    const errors = validateRegistration({ email: '', password: '', confirmPassword: '' });

    expect(errors).toEqual({
      email: 'auth.validation.emailRequired',
      password: 'auth.validation.passwordRequired',
      confirmPassword: 'auth.validation.confirmPasswordRequired',
    });
    expect(firstInvalidField(errors, ['email', 'password', 'confirmPassword'])).toBe('email');
  });

  it('distinguishes invalid email, short password, weak password, and mismatch', () => {
    expect(
      validateRegistration({ email: 'invalid', password: 'short', confirmPassword: 'other' }),
    ).toEqual({
      email: 'auth.validation.emailInvalid',
      password: 'auth.validation.passwordMinLength',
      confirmPassword: 'auth.validation.passwordMismatch',
    });
    expect(
      validateRegistration({
        email: 'person@example.com',
        password: 'lowercaseonly',
        confirmPassword: 'lowercaseonly',
      }),
    ).toEqual({ password: 'auth.validation.passwordComplexity' });
  });

  it('accepts valid login and registration values', () => {
    expect(validateLogin({ email: 'person@example.com', password: 'Test123456!' })).toEqual({});
    expect(
      validateRegistration({
        email: 'person@example.com',
        password: 'Test123456!',
        confirmPassword: 'Test123456!',
      }),
    ).toEqual({});
  });
});
