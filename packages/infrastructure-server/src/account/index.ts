/**
 * Account Module - Infrastructure Server
 *
 * Ports and Adapters for Account module persistence.
 */

// Container
export { AccountContainer } from './account.container';
export { AccountContainer as default } from './di/account-container';

// Ports (Interfaces)
export { type IAccountRepository } from './ports/account-repository.port';

// Prisma Adapters
export { AccountPrismaRepository } from './adapters/prisma/account-prisma.repository';
export { PrismaAccountRepository } from './repositories/prisma-account.repository';

// Memory Adapters
export { AccountMemoryRepository } from './adapters/memory/account-memory.repository';
