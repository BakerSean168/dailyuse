/**
 * AuthCredential Entity - Server Interface
 *
 * Base interface for authentication credentials
 */

import type { CredentialStatus } from '../value-objects/credential-status';
import { CredentialType, type AuthCredentialId } from '../value-objects';
import type { DomainDate, PersistenceDate, TransferDate } from '@/primitives';

// ============ Base Credential Interface ============

export interface BaseAuthCredentialServer {
  /**
   * Credential ID
   */
  id: AuthCredentialId;

  /**
   * Credential type
   */
  type: CredentialType;

  /**
   * Credential status
   */
  status: CredentialStatus;

  /**
   * Created at timestamp
   */
  createdAt: DomainDate;

  /**
   * Last used at timestamp (null if never used)
   */
  lastUsedAt: DomainDate | null;
}

export interface BaseAuthCredentialServerDTO {
  id: AuthCredentialId;
  type: CredentialType;
  status: CredentialStatus;
  createdAt: TransferDate;
  lastUsedAt: TransferDate | null;
}

export interface BaseAuthCredentialPersistenceDTO {
  id: AuthCredentialId;
  type: CredentialType;
  status: CredentialStatus;
  createdAt: PersistenceDate;
  lastUsedAt: PersistenceDate | null;
}
