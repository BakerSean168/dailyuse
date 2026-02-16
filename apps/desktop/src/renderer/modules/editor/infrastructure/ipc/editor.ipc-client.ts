/**
 * Editor IPC Client - Editor 妯″潡 IPC 瀹㈡埛绔? * 
 * @module renderer/modules/editor/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { EditorChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface DocumentDTO {
  id: string;
  identityId: string;
  title: string;
  content: string;
  contentType: ContentType;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  metadata: DocumentMetadataDTO;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export type ContentType = 'plain_text' | 'markdown' | 'rich_text' | 'code';
export type LinkedEntityType = 'task' | 'goal' | 'schedule' | 'note';

export interface DocumentMetadataDTO {
  wordCount: number;
  characterCount: number;
  lineCount: number;
  readingTimeMinutes: number;
  language?: string;
  tags?: string[];
  lastEditedPosition?: EditorPositionDTO;
}

export interface EditorPositionDTO {
  line: number;
  column: number;
  offset: number;
}

export interface VersionDTO {
  version: number;
  content: string;
  updatedAt: number;
}

export interface SearchResultDTO {
  documentId: string;
  matches: SearchMatchDTO[];
  totalMatches: number;
}

export interface SearchMatchDTO {
  line: number;
  column: number;
  length: number;
  preview: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  contentType?: ContentType;
}

export interface UpdateDocumentRequest {
  id: string;
  title?: string;
  content?: string;
}

// ============ Editor IPC Client ============

/**
 * Editor IPC Client
 */
export class EditorIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Document CRUD ============

  /**
   * Get document list
   */
  async listDocuments(): Promise<DocumentDTO[]> {
    return this.client.invoke<DocumentDTO[]>(
      EditorChannels.DOCUMENT_LIST,
      {}
    );
  }

  /**
   * Get single document
   */
  async getDocument(id: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_GET,
      { id }
    );
  }

  /**
   * Create document
   */
  async createDocument(params: CreateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_CREATE,
      params
    );
  }

  /**
   * Update document
   */
  async updateDocument(params: UpdateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_UPDATE,
      params
    );
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DOCUMENT_DELETE,
      { id }
    );
  }

  /**
   * 閫氳繃鍏宠仈瀹炰綋Get鏂囨。
   */
  async getByLinkedEntity(entityType: LinkedEntityType, entityId: string): Promise<DocumentDTO | null> {
    return this.client.invoke<DocumentDTO | null>(
      EditorChannels.DOCUMENT_GET_BY_LINKED_ENTITY,
      { entityType, entityId }
    );
  }

  /**
   * Create document for linked entity   */
  async createForLinkedEntity(params: {
    entityType: LinkedEntityType;
    entityId: string;
    title?: string;
    contentType?: ContentType;
  }): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_CREATE_FOR_LINKED_ENTITY,
      params
    );
  }

  /**
   * Save document
   */
  async saveDocument(id: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_SAVE,
      { id, content }
    );
  }

  // ============ Content Operations ============

  /**
   * Get document content
   */
  async getContent(id: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.GET_CONTENT,
      { id }
    );
  }

  /**
   * Save document鍐呭
   */
  async saveContent(id: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.SAVE_CONTENT,
      { id, content }
    );
  }

  /**
   * 鑷姩Save
   */
  async autoSave(id: string, content: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.AUTO_SAVE,
      { id, content }
    );
  }

  // ============ History & Versioning ============

  /**
   * Undo
   */
  async undo(id: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.UNDO,
      { id }
    );
  }

  /**
   * Redo
   */
  async redo(id: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.REDO,
      { id }
    );
  }

  /**
   * Get edit history
   */
  async getHistory(id: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.GET_HISTORY,
      { id }
    );
  }

  /**
   * Get version list
   */
  async listVersions(id: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.VERSION_LIST,
      { id }
    );
  }

  /**
   * Get specific version
   */
  async getVersion(id: string, version: number): Promise<VersionDTO> {
    return this.client.invoke<VersionDTO>(
      EditorChannels.VERSION_GET,
      { id, version }
    );
  }

  /**
   * 鎭㈠鍒扮壒瀹氱増鏈?   */
  async restoreVersion(id: string, version: number): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.VERSION_RESTORE,
      { id, version }
    );
  }

  // ============ Assets ============

  /**
   * Upload image
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const buffer = await file.arrayBuffer();
    return this.client.invoke(
      EditorChannels.UPLOAD_IMAGE,
      { 
        name: file.name, 
        type: file.type,
        data: Array.from(new Uint8Array(buffer))
      }
    );
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DELETE_ASSET,
      { assetId }
    );
  }

  // ============ Search ============

  /**
   * Search document
   */
  async search(query: string): Promise<SearchResultDTO[]> {
    return this.client.invoke<SearchResultDTO[]>(
      EditorChannels.SEARCH,
      { query }
    );
  }

  // ============ Export ============

  /**
   * Export to Markdown
   */
  async exportMarkdown(id: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_MARKDOWN,
      { id }
    );
  }

  /**
   * Export to HTML
   */
  async exportHtml(id: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_HTML,
      { id }
    );
  }

  /**
   * Export to PDF
   */
  async exportPdf(id: string): Promise<Uint8Array> {
    return this.client.invoke<Uint8Array>(
      EditorChannels.EXPORT_PDF,
      { id }
    );
  }

  /**
   * Create or get document for goal
   */
  async getOrCreateForGoal(goalId: string, title?: string): Promise<DocumentDTO> {
    const existing = await this.getByLinkedEntity('goal', goalId);
    if (existing) return existing;
    return this.createForLinkedEntity({
      entityType: 'goal',
      entityId: goalId,
      title: title || 'Goal Notes',
      contentType: 'markdown',
    });
  }

  /**
   * 蹇€熷垱寤?Markdown 鏂囨。
   */
  async quickCreateMarkdown(params: {
    identityId: string;
    title: string;
    content?: string;
  }): Promise<DocumentDTO> {
    return this.createDocument({
      ...params,
      content: params.content || '',
      contentType: 'markdown',
    });
  }

  // ============ Event Subscriptions ============

  /**
   * Subscribe to document update events
   */
  onDocumentUpdated(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_DOCUMENT_UPDATED, handler);
  }

  /**
   * 璁㈤槄鑷姩Save浜嬩欢
   */
  onAutosaveCompleted(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_AUTOSAVE_COMPLETED, handler);
  }
}

// ============ Singleton Export ============

export const editorIPCClient = new EditorIPCClient();
