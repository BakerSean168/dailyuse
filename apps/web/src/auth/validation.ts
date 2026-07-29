import { RegisterByEmailSchema } from '@memoflow/contracts/authentication';

export type LoginField = 'email' | 'password';
export type RegisterField = 'email' | 'password' | 'confirmPassword';
export type ForgotField = 'email';
export type ResetField = 'email' | 'code' | 'newPassword' | 'confirmPassword';
export type VerifyEmailField = 'email' | 'code';

export type AuthValidationKey =
  | 'auth.validation.emailRequired'
  | 'auth.validation.emailInvalid'
  | 'auth.validation.passwordRequired'
  | 'auth.validation.passwordMinLength'
  | 'auth.validation.passwordMaxLength'
  | 'auth.validation.passwordComplexity'
  | 'auth.validation.confirmPasswordRequired'
  | 'auth.validation.passwordMismatch'
  | 'auth.validation.codeRequired'
  | 'auth.validation.codeInvalid';

export type LoginValidationErrors = Partial<Record<LoginField, AuthValidationKey>>;
export type RegisterValidationErrors = Partial<Record<RegisterField, AuthValidationKey>>;
export type ForgotValidationErrors = Partial<Record<ForgotField, AuthValidationKey>>;
export type ResetValidationErrors = Partial<Record<ResetField, AuthValidationKey>>;
export type VerifyEmailValidationErrors = Partial<Record<VerifyEmailField, AuthValidationKey>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

function emailError(email: string): AuthValidationKey | undefined {
  if (!email.trim()) return 'auth.validation.emailRequired';
  if (!EMAIL_PATTERN.test(email.trim())) return 'auth.validation.emailInvalid';
  return undefined;
}

function codeError(code: string): AuthValidationKey | undefined {
  if (!code.trim()) return 'auth.validation.codeRequired';
  if (!CODE_PATTERN.test(code.trim())) return 'auth.validation.codeInvalid';
  return undefined;
}

function passwordComplexityError(password: string): AuthValidationKey | undefined {
  const parsed = RegisterByEmailSchema.safeParse({
    email: 'person@example.com',
    password,
  });
  if (parsed.success) return undefined;
  const issue = parsed.error.issues.find((item) => item.path[0] === 'password');
  if (!issue) return undefined;
  if (!password) return 'auth.validation.passwordRequired';
  if (issue.code === 'too_small') return 'auth.validation.passwordMinLength';
  if (issue.code === 'too_big') return 'auth.validation.passwordMaxLength';
  return 'auth.validation.passwordComplexity';
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

export function validateForgotPassword(values: { email: string }): ForgotValidationErrors {
  const errors: ForgotValidationErrors = {};
  const nextEmailError = emailError(values.email);
  if (nextEmailError) errors.email = nextEmailError;
  return errors;
}

export function validateResetPassword(values: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): ResetValidationErrors {
  const errors: ResetValidationErrors = {};
  const nextEmailError = emailError(values.email);
  if (nextEmailError) errors.email = nextEmailError;

  const nextCodeError = codeError(values.code);
  if (nextCodeError) errors.code = nextCodeError;

  const nextPasswordError = passwordComplexityError(values.newPassword);
  if (nextPasswordError) errors.newPassword = nextPasswordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = 'auth.validation.confirmPasswordRequired';
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'auth.validation.passwordMismatch';
  }

  return errors;
}

export function validateVerifyEmail(values: {
  email: string;
  code: string;
}): VerifyEmailValidationErrors {
  const errors: VerifyEmailValidationErrors = {};
  const nextEmailError = emailError(values.email);
  if (nextEmailError) errors.email = nextEmailError;
  const nextCodeError = codeError(values.code);
  if (nextCodeError) errors.code = nextCodeError;
  return errors;
}

export function firstInvalidField<TField extends string>(
  errors: Partial<Record<TField, AuthValidationKey>>,
  order: readonly TField[],
): TField | null {
  return order.find((field) => Boolean(errors[field])) ?? null;
}
