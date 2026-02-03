/**
 * User Registered Event
 * 
 * Triggered when: New user successfully registers
 * Subscribers: Onboarding service, User creation, Email service
 */
export interface UserRegisteredEvent {
  /** User/Identity identifier */
  identityId: string;

  /** User email */
  email: string;

  /** Registration timestamp */
  registeredAt: number;
}
