/**
 * Editor IPC Client - Editor 妯″潡 IPC 瀹㈡埛绔? * 
 * @module renderer/modules/editor/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { EditorChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface DocumentDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  contentType: ContentType;
  linkedEntityType?: LinkedEntityType;
  linkedEntityUuid?: string;
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
  documentUuid: string;
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
  uuid: string;
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
  async getDocument(uuid: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_GET,
      { uuid }
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
  async deleteDocument(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DOCUMENT_DELETE,
      { uuid }
    );
  }

  /**
   * 閫氳繃鍏宠仈瀹炰綋Get鏂囨。
   */
  async getByLinkedEntity(entityType: LinkedEntityType, entityUuid: string): Promise<DocumentDTO | null> {
    return this.client.invoke<DocumentDTO | null>(
      EditorChannels.DOCUMENT_GET_BY_LINKED_ENTITY,
      { entityType, entityUuid }
    );
  }

  /**
   * Create document for linked entity   */
  async createForLinkedEntity(params: {
    entityType: LinkedEntityType;
    entityUuid: string;
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
  async saveDocument(uuid: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_SAVE,
      { uuid, content }
    );
  }

  // ============ Content Operations ============

  /**
   * Get document content
   */
  async getContent(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.GET_CONTENT,
      { uuid }
    );
  }

  /**
   * Save document鍐呭
   */
  async saveContent(uuid: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.SAVE_CONTENT,
      { uuid, content }
    );
  }

  /**
   * 鑷姩Save
   */
  async autoSave(uuid: string, content: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.AUTO_SAVE,
      { uuid, content }
    );
  }

  // ============ History & Versioning ============

  /**
   * Undo
   */
  async undo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.UNDO,
      { uuid }
    );
  }

  /**
   * Redo
   */
  async redo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.REDO,
      { uuid }
    );
  }

  /**
   * Get edit history
   */
  async getHistory(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.GET_HISTORY,
      { uuid }
    );
  }

  /**
   * Get version list
   */
  async listVersions(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.VERSION_LIST,
      { uuid }
    );
  }

  /**
   * Get specific version
   */
  async getVersion(uuid: string, version: number): Promise<VersionDTO> {
    return this.client.invoke<VersionDTO>(
      EditorChannels.VERSION_GET,
      { uuid, version }
    );
  }

  /**
   * 鎭㈠鍒扮壒瀹氱増鏈?   */
  async restoreVersion(uuid: string, version: number): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.VERSION_RESTORE,
      { uuid, version }
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
  async exportMarkdown(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_MARKDOWN,
      { uuid }
    );
  }

  /**
   * Export to HTML
   */
  async exportHtml(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_HTML,
      { uuid }
    );
  }

  /**
   * Export to PDF
   */
  async exportPdf(uuid: string): Promise<Uint8Array> {
    return this.client.invoke<Uint8Array>(
      EditorChannels.EXPORT_PDF,
      { uuid }
    );
  }

  /**
   * Create or get document for goal
   */
  async getOrCreateForGoal(goalUuid: string, title?: string): Promise<DocumentDTO> {
    const existing = await this.getByLinkedEntity('goal', goalUuid);
    if (existing) return existing;
    return this.createForLinkedEntity({
      entityType: 'goal',
      entityUuid: goalUuid,
      title: title || 'Goal Notes',
      contentType: 'markdown',
    });
  }

  /**
   * 蹇€熷垱寤?Markdown 鏂囨。
   */
  async quickCreateMarkdown(params: {
    accountUuid: string;
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
