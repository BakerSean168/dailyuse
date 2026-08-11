export interface RevokeAuthenticationResult {
  revokedSessions: number;
  userDisabled: boolean;
}

export interface DeleteUserDataResult {
  /** 'completed' only when data was actually deleted/anonymized; 'not_performed' when policy action was skipped. */
  piiCleanupStatus: 'completed' | 'scheduled' | 'retained_by_policy' | 'not_performed';
  deletedAt: number | null;
  reason?: string;
}

/**
 * Application port for Cloud Auth credential revocation and data policy actions.
 * Separates immediate credential/session revocation from data retention/deletion policy.
 */
export interface CloudAuthRevocationPort {
  /**
   * Revoke active authentication credentials (sessions, device codes, disable user).
   */
  revokeAuthentication(identityId: string): Promise<RevokeAuthenticationResult>;

  /**
   * Execute PII data deletion/retention policy operations for identityId.
   */
  deleteUserData(identityId: string): Promise<DeleteUserDataResult>;

  /**
   * Backward-compatibility helper delegating to revokeAuthentication.
   */
  revokeAll?(identityId: string): Promise<{ revokedSessions: number }>;
}
