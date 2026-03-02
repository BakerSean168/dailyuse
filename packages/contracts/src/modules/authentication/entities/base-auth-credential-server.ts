/**
 * AuthCredential Entity - Server DTO
 *
 * Base DTO interface for authentication credentials.
 * Base entity interface has been moved to domain model internal definition.
 */

import type { CredentialStatus } from '../value-objects/credential-status';
import { CredentialType, type AuthCredentialId } from '../value-objects';
import type { TransferDate } from '../../../primitives';

// ============ Base Credential DTO ============

export interface BaseAuthCredentialServerDTO {
  id: AuthCredentialId;
  type: CredentialType;
  status: CredentialStatus;
  createdAt: TransferDate;
  lastUsedAt: TransferDate | null;
}