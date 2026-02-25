/**
 * Authentication Module - Public Exports
 *
 * @module modules/authentication
 */

export { useAuthenticationStore } from './stores/authenticationStore';
export type { AuthenticationState } from './stores/authenticationStore';
export { useAuth } from './composables/useAuth';
export { useSession } from './composables/useSession';
export { usePassword } from './composables/usePassword';

// Components
export * from './components';
