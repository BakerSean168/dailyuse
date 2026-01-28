import type { PasswordCredential } from '../entities/password-credential-server';
import type { OAuthCredential } from '../entities/oauth-credential-server';
import type { PhoneCredential } from '../entities/phone-credential-server';

export type AuthCredential = 
  | PasswordCredential 
  | OAuthCredential 
  | PhoneCredential;