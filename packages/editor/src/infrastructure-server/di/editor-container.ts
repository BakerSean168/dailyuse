import type { IEditorWorkspaceRepository } from '../../domain-server/repositories/IEditorWorkspaceRepository';
import type Database from 'better-sqlite3';
import { SqliteEditorWorkspaceRepository } from '../adapters/sqlite/editor-workspace-sqlite.repository';

/**
 * Editor Module DI Container
 * Manages all repository instances for the Editor module
 */
export class EditorContainer {
  private static instance: EditorContainer;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;
  private db?: Database.Database;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EditorContainer {
    if (!EditorContainer.instance) {
      EditorContainer.instance = new EditorContainer();
    }
    return EditorContainer.instance;
  }

  /**
   * Initialize with a better-sqlite3 database instance
   */
  initialize(db: Database.Database): void {
    this.db = db;
  }

  /**
   * Get EditorWorkspace aggregate repository
   * Uses lazy loading - creates instance on first access
   */
  getEditorWorkspaceRepository(): IEditorWorkspaceRepository {
    if (!this.editorWorkspaceRepository) {
      if (!this.db) {
        throw new Error('EditorContainer not initialized. Call initialize(db) first.');
      }
      this.editorWorkspaceRepository = new SqliteEditorWorkspaceRepository(this.db);
    }
    return this.editorWorkspaceRepository;
  }

  /**
   * Set EditorWorkspace aggregate repository (for testing)
   */
  setEditorWorkspaceRepository(repository: IEditorWorkspaceRepository): void {
    this.editorWorkspaceRepository = repository;
  }

  /**
   * Reset all repository instances
   */
  reset(): void {
    this.editorWorkspaceRepository = null;
    this.db = undefined;
  }
}