/**
 * Authentication Strategies
 *
 * Passport strategies for JWT and local authentication.
 * Factory functions that return configured Passport strategies for Express apps.
 */

export { createJwtStrategy } from './jwt.strategy';
export { createLocalStrategy } from './local.strategy';
export type { JwtStrategyConfig } from './jwt.strategy';
export type { LocalStrategyConfig } from './local.strategy';
