/**
 * Authentication Infrastructure Types
 *
 * Database row types for Prisma models with their relations.
 * These types describe the exact shape returned by Prisma queries.
 */

export type {
  PrismaAuthIdentityWithRelations,
  PrismaAuthIdentifierRow,
  PrismaAuthOAuthBindingRow,
  PrismaAuthCredentialRow,
} from './prisma-auth-identity-types';

export type { PrismaAuthSessionRow } from './prisma-auth-session-types';
