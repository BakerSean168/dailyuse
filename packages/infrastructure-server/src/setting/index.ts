/**
 * Setting Module - Infrastructure Server
 *
 * Ports and Adapters for Setting module persistence.
 */

// Container
export { SettingContainer } from './setting.container';

// Ports (Interfaces)
export { type IAppConfigRepository } from './ports/app-config-repository.port';
export { type ISettingRepository } from './ports/setting-repository.port';
export { type IUserSettingRepository } from './ports/user-setting-repository.port';

// Prisma Adapters
export { AppConfigPrismaRepository } from './adapters/prisma/app-config-prisma.repository';
export { SettingPrismaRepository } from './adapters/prisma/setting-prisma.repository';
export { UserSettingPrismaRepository } from './adapters/prisma/user-setting-prisma.repository';

// Memory Adapters
export { AppConfigMemoryRepository } from './adapters/memory/app-config-memory.repository';
export { SettingMemoryRepository } from './adapters/memory/setting-memory.repository';
export { UserSettingMemoryRepository } from './adapters/memory/user-setting-memory.repository';
