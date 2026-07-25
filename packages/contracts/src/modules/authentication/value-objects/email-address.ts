/**
 * EmailAddress Value Object
 *
 * Residual 855: EmailAddressDTO dual retired — sole EmailAddress interface + type alias.
 */

// Residual 855: sole EmailAddress body.
export interface EmailAddress {
  readonly value: string;
}

// Residual 855: EmailAddressDTO dual retired — DTO is the EmailAddress shape.
export type EmailAddressDTO = EmailAddress;
