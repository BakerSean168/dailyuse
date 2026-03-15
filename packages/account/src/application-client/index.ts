/**
 * Account Application Client Layer
 *
 * Client-side application services for the Account module.
 * Consumers construct `AccountClientService` with an injected `IAccountApiClient`.
 */

export { AccountClientService } from './services/account-client-service';
export type { IAccountApiClient } from './ports/account-api-client.port';

// Re-export as alias for backward compatibility
export { AccountClientService as AccountApplicationService } from './services/account-client-service';
