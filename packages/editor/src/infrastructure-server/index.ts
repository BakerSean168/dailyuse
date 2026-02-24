/**
 * Editor Module - Infrastructure Server
 *
 * Repository implementations for Editor domain.
 */

// DI Container
export { EditorContainer } from './di/editor-container';

// Prisma Adapters
export {
  EditorWorkspacePrismaRepository,
  DocumentPrismaRepository,
} from './adapters/prisma';

// SQLite Adapters
export {
  SqliteDocumentRepository,
  SqliteDocumentVersionRepository,
  SqliteEditorWorkspaceRepository,
  SqliteEditorGroupRepository,
  SqliteEditorTabRepository,
  SqliteEditorSessionRepository,
  SqliteLinkedResourceRepository,
  SqliteSearchEngineRepository,
} from './adapters/sqlite';

// SQLite Schema
export { EDITOR_MODULE_SCHEMA } from './adapters/sqlite/schema';
