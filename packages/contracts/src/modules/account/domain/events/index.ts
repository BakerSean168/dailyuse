/**
 * Account Module - Domain Events
 * 
 * All domain event types for the Account module
 */

export type { AccountCreatedEvent } from './account-created.event';
export type { AccountClosedEvent } from './account-closed.event';
export type { AccountProfileUpdatedEvent } from './account-profile-updated.event';
export type { AccountSettingsUpdatedEvent } from './account-settings-updated.event';

// Re-export union type
export type { AccountCreatedEvent as AccountDomainEvent } from './account-created.event';
