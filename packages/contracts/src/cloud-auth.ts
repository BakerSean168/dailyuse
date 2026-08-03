import type { Result } from './result';

export interface CloudAccountSummary {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface CloudSessionSummary {
  id: string;
  expiresAt: string;
}

export interface CloudAuthResponse {
  account: CloudAccountSummary;
  session: CloudSessionSummary | null;
  requiresEmailVerification: boolean;
}

export interface CloudSessionState {
  account: CloudAccountSummary | null;
  session: CloudSessionSummary | null;
}

export type DeviceAuthorizationDecisionStatus = 'pending' | 'approved' | 'denied';

export interface DeviceAuthorizationVerification {
  userCode: string;
  status: DeviceAuthorizationDecisionStatus;
}

export type DesktopCloudConnectionStatus =
  | 'requesting_code'
  | 'awaiting_authorization'
  | 'connecting_profile'
  | 'connected'
  | 'denied'
  | 'expired'
  | 'cancelled'
  | 'failed';

export interface DesktopCloudConnectionAttempt {
  attemptId: string;
  userCode: string;
  verificationUrl: string;
  expiresAt: string;
  status: DesktopCloudConnectionStatus;
  error: { code: string; message: string } | null;
}

export interface CloudSignInRequest {
  email: string;
  password: string;
}

export interface CloudSignUpRequest extends CloudSignInRequest {
  name?: string;
}

export interface CloudSessionClientPort {
  signOut(): Promise<Result<void>>;
  getSession(): Promise<Result<CloudSessionState>>;
}

export interface CloudAuthClientPort extends CloudSessionClientPort {
  signIn(request: CloudSignInRequest): Promise<Result<CloudAuthResponse>>;
  signUp(request: CloudSignUpRequest): Promise<Result<CloudAuthResponse>>;
  forgotPassword(email: string): Promise<Result<void>>;
  resetPassword(input: { token: string; newPassword: string }): Promise<Result<void>>;
  changePassword(input: { currentPassword: string; newPassword: string }): Promise<Result<void>>;
}

export interface CloudAuthWebClientPort extends CloudAuthClientPort {
  beginGithubSignIn(callbackURL?: string): Promise<Result<{ url: string }>>;
  getDeviceAuthorization(userCode: string): Promise<Result<DeviceAuthorizationVerification>>;
  approveDeviceAuthorization(userCode: string): Promise<Result<void>>;
  denyDeviceAuthorization(userCode: string): Promise<Result<void>>;
}

export interface CloudAuthDesktopClientPort extends CloudSessionClientPort {
  beginCloudConnection(): Promise<Result<DesktopCloudConnectionAttempt>>;
  getCurrentCloudConnection(): Promise<Result<DesktopCloudConnectionAttempt | null>>;
  getCloudConnectionStatus(attemptId: string): Promise<Result<DesktopCloudConnectionAttempt>>;
  cancelCloudConnection(attemptId: string): Promise<Result<void>>;
}
