import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail } from '@memoflow/contracts/result';
import { useWebAuth } from './useWebAuth';

const service = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  beginGithubSignIn: vi.fn(),
  getDeviceAuthorization: vi.fn(),
  approveDeviceAuthorization: vi.fn(),
  denyDeviceAuthorization: vi.fn(),
}));

vi.mock('./service', () => ({
  useAuthService: () => service,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe('useWebAuth email sign-in outcomes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps invalid credentials as an error instead of requesting email verification', async () => {
    service.signIn.mockResolvedValue(
      fail({
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: 'Invalid email or password',
      }),
    );
    const auth = useWebAuth();

    const outcome = await auth.loginByEmail({
      email: 'person@example.com',
      password: 'Wrong-password-123',
    });

    expect(outcome).toBe(false);
    expect(auth.pendingVerificationEmail.value).toBeNull();
    expect(auth.errorMessage.value).toBe('Invalid email or password');
  });

  it('requests email verification only for Better Auth EMAIL_NOT_VERIFIED', async () => {
    service.signIn.mockResolvedValue(
      fail({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email not verified',
      }),
    );
    const auth = useWebAuth();

    const outcome = await auth.loginByEmail({
      email: 'person@example.com',
      password: 'Correct-password-123',
    });

    expect(outcome).toBe('needs-email-verification');
    expect(auth.pendingVerificationEmail.value).toBe('person@example.com');
    expect(auth.errorMessage.value).toBeNull();
  });
});
