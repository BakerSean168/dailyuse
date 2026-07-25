/**
 * PhoneNumber Value Object
 *
 * Residual 855: PhoneNumberDTO dual retired — sole PhoneNumber interface + type alias.
 */

// Residual 855: sole PhoneNumber body.
export interface PhoneNumber {
  readonly value: string;
}

// Residual 855: PhoneNumberDTO dual retired — DTO is the PhoneNumber shape.
export type PhoneNumberDTO = PhoneNumber;
