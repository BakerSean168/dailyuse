import { RegisterByEmailSchema } from '@memoflow/contracts/authentication';
import { describe, expect, it } from 'vitest';

import {
  firstInvalidField,
  validateForgotPassword,
  validateLogin,
  validateRegistration,
  validateResetPassword,
  validateVerifyEmail,
} from './validation';

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

  it('inherits the shared registration password maximum length contract', () => {
    const passwordAtLimit = `A1${'a'.repeat(98)}`;
    const passwordOverLimit = `A1${'a'.repeat(99)}`;

    expect(passwordAtLimit.length).toBe(100);
    expect(passwordOverLimit.length).toBe(101);
    expect(RegisterByEmailSchema.safeParse({ email: 'person@example.com', password: passwordAtLimit }).success).toBe(
      true,
    );
    expect(
      validateRegistration({
        email: 'person@example.com',
        password: passwordOverLimit,
        confirmPassword: passwordOverLimit,
      }),
    ).toEqual({ password: 'auth.validation.passwordMaxLength' });
  });

  it('validates forgot password email', () => {
    expect(validateForgotPassword({ email: '' })).toEqual({
      email: 'auth.validation.emailRequired',
    });
    expect(validateForgotPassword({ email: 'person@example.com' })).toEqual({});
  });

  it('validates reset password fields including 6-digit code', () => {
    expect(
      validateResetPassword({
        email: 'person@example.com',
        code: '12',
        newPassword: 'Test123456!',
        confirmPassword: 'Test123456!',
      }),
    ).toEqual({ code: 'auth.validation.codeInvalid' });

    expect(
      validateResetPassword({
        email: 'person@example.com',
        code: '123456',
        newPassword: 'Test123456!',
        confirmPassword: 'Test123456!',
      }),
    ).toEqual({});
  });

  it('validates email verification fields', () => {
    expect(validateVerifyEmail({ email: 'person@example.com', code: '' })).toEqual({
      code: 'auth.validation.codeRequired',
    });
    expect(validateVerifyEmail({ email: 'person@example.com', code: '123456' })).toEqual({});
  });
});
