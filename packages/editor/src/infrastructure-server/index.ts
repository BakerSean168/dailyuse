/**
 * Editor Module - Infrastructure Server
 *
 * Repository implementations for Editor domain.
 */

// DI Container
export { EditorContainer } from './di/editor-container';

// Prisma Adapters
export { EditorWorkspacePrismaRepository, DocumentPrismaRepository } from './adapters/prisma';

// PowerSync Adapters
export { PowerSyncEditorWorkspaceRepository } from './adapters/powersync';
