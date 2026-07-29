/**
 * Prisma AuthIdentity Row Types
 *
 * Database row types as returned by Prisma queries with included relations.
 * 对应 Prisma schema 中的 AuthIdentity + 关联表。
 */

import type {
  AuthIdentity as PrismaAuthIdentity,
  AuthIdentifier as PrismaAuthIdentifier,
  AuthOAuthBinding as PrismaAuthOAuthBinding,
  AuthCredential as PrismaAuthCredential,
} from '@memoflow/database';

/** AuthIdentifier Prisma row */
export type PrismaAuthIdentifierRow = PrismaAuthIdentifier;

/** AuthOAuthBinding Prisma row */
export type PrismaAuthOAuthBindingRow = PrismaAuthOAuthBinding;

/** AuthCredential Prisma row */
export type PrismaAuthCredentialRow = PrismaAuthCredential;

/**
 * AuthIdentity with eagerly loaded relations
 *
 * Prisma 查询返回的完整 AuthIdentity 行 + 所有子表数据。
 * 对应 `prisma.authIdentity.findUnique({ include: { identifiers, oauthBindings, credentials } })`
 */
export type PrismaAuthIdentityWithRelations = PrismaAuthIdentity & {
  identifiers: PrismaAuthIdentifierRow[];
  oauthBindings: PrismaAuthOAuthBindingRow[];
  credentials: PrismaAuthCredentialRow[];
};
