/**
 * Editor Module - SQLite Exports
 */

export { EditorContainer } from './di/editor-container';
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
export { EDITOR_MODULE_SCHEMA } from './adapters/sqlite/schema';
