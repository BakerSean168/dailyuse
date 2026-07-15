export type LoginField = 'email' | 'password';
export type RegisterField = 'email' | 'password' | 'confirmPassword';
export type AuthValidationKey =
  | 'auth.validation.emailRequired'
  | 'auth.validation.emailInvalid'
  | 'auth.validation.passwordRequired'
  | 'auth.validation.passwordMinLength'
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

function passwordError(password: string): AuthValidationKey | undefined {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < 8) return 'auth.validation.passwordMinLength';

  const categoryCount = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  if (categoryCount < 2) return 'auth.validation.passwordComplexity';
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
  const nextEmailError = emailError(values.email);
  const nextPasswordError = passwordError(values.password);

  if (nextEmailError) errors.email = nextEmailError;
  if (nextPasswordError) errors.password = nextPasswordError;
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
