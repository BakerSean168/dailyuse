import type { IEditorWorkspaceRepository } from '../../domain-server/repositories/IEditorWorkspaceRepository';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import { PowerSyncEditorWorkspaceRepository } from '../adapters/powersync/editor-workspace-powersync.repository';

/**
 * Editor Module DI Container
 * Manages all repository instances for the Editor module
 */
export class EditorContainer {
  private static instance: EditorContainer;
  private editorWorkspaceRepository: IEditorWorkspaceRepository | null = null;
  private db?: IElectronDatabase;

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
   * Initialize with PowerSync-compatible electron database contract
   */
  initialize(db: IElectronDatabase): void {
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
      this.editorWorkspaceRepository = new PowerSyncEditorWorkspaceRepository(this.db);
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
