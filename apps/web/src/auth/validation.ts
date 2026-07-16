import { RegisterByEmailSchema } from '@dailyuse/contracts/authentication';

export type LoginField = 'email' | 'password';
export type RegisterField = 'email' | 'password' | 'confirmPassword';
export type AuthValidationKey =
  | 'auth.validation.emailRequired'
  | 'auth.validation.emailInvalid'
  | 'auth.validation.passwordRequired'
  | 'auth.validation.passwordMinLength'
  | 'auth.validation.passwordMaxLength'
  | 'auth.validation.passwordComplexity'
  | 'auth.validation.confirmPasswordRequired'
  | 'auth.validation.passwordMismatch';

export type LoginValidationErrors = Partial<Record<LoginField, AuthValidationKey>>;
export type RegisterValidationErrors = Partial<Record<RegisterField, AuthValidationKey>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): AuthValidationKey | undefined {
  if (!email.trim()) return 'auth.validation.emailRequired';
  if (!EMAIL_PATTERN.test(email.trim())) return 'auth.validation.emailInvalid';
  return undefined;
}

export function validateLogin(values: {
  email: string;
  password: string;
}): LoginValidationErrors {
  const errors: LoginValidationErrors = {};
  const nextEmailError = emailError(values.email);
  if (nextEmailError) errors.email = nextEmailError;
  if (!values.password) errors.password = 'auth.validation.passwordRequired';
  return errors;
}

export function validateRegistration(values: {
  email: string;
  password: string;
  confirmPassword: string;
}): RegisterValidationErrors {
  const errors: RegisterValidationErrors = {};
  const email = values.email.trim();
  const parsed = RegisterByEmailSchema.safeParse({ email, password: values.password });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email' && !errors.email) {
        errors.email = email ? 'auth.validation.emailInvalid' : 'auth.validation.emailRequired';
      }
      if (field === 'password' && !errors.password) {
        if (!values.password) {
          errors.password = 'auth.validation.passwordRequired';
        } else if (issue.code === 'too_small') {
          errors.password = 'auth.validation.passwordMinLength';
        } else if (issue.code === 'too_big') {
          errors.password = 'auth.validation.passwordMaxLength';
        } else {
          errors.password = 'auth.validation.passwordComplexity';
        }
      }
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'auth.validation.confirmPasswordRequired';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'auth.validation.passwordMismatch';
  }

  return errors;
}

export function firstInvalidField<TField extends string>(
  errors: Partial<Record<TField, AuthValidationKey>>,
  order: readonly TField[],
): TField | null {
  return order.find((field) => Boolean(errors[field])) ?? null;
}
