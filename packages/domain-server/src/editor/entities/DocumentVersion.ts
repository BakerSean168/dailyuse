/**
 * DocumentVersion 实体实现
 * 实现 DocumentVersionServer 接口
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import {
  VersionChangeType,
} from '@dailyuse/contracts/editor';
import type {
  DocumentVersionClientDTO,
  DocumentVersionPersistenceDTO,
  DocumentVersionServer,
  DocumentVersionServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  DocumentVersionId,
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';

/**
 * DocumentVersion 实体
 */
export class DocumentVersion extends Entity<DocumentVersionId> implements DocumentVersionServer {
  // ===== 私有字段 =====
  private _documentId: DocumentId;
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _versionNumber: number;
  private _changeType: VersionChangeType;
  private _contentHash: string;
  private _contentDiff: string | null;
  private _changeDescription: string | null;
  private _previousVersionId: DocumentVersionId | null;
  private _createdBy: string | null;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id: DocumentVersionId;
    documentId: DocumentId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    versionNumber: number;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previousVersionId?: DocumentVersionId | null;
    createdBy?: string | null;
    createdAt: Date;
  }) {
    super(params.id);
    this._documentId = params.documentId;
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._versionNumber = params.versionNumber;
    this._changeType = params.changeType;
    this._contentHash = params.contentHash;
    this._contentDiff = params.contentDiff ?? null;
    this._changeDescription = params.changeDescription ?? null;
    this._previousVersionId = params.previousVersionId ?? null;
    this._createdBy = params.createdBy ?? null;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public get documentId(): DocumentId {
    return this._documentId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get versionNumber(): number {
    return this._versionNumber;
  }

  public get changeType(): VersionChangeType {
    return this._changeType;
  }

  public get contentHash(): string {
    return this._contentHash;
  }

  public get contentDiff(): string | null {
    return this._contentDiff;
  }

  public get changeDescription(): string | null {
    return this._changeDescription;
  }

  public get previousVersionId(): DocumentVersionId | null {
    return this._previousVersionId;
  }

  public get createdBy(): string | null {
    return this._createdBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的文档版本
   */
  public static create(params: {
    documentId: DocumentId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    versionNumber: number;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previousVersionId?: DocumentVersionId | null;
    createdBy?: string | null;
  }): DocumentVersion {
    const id = generateUUID() as DocumentVersionId;
    return new DocumentVersion({
      id,
      documentId: params.documentId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      versionNumber: params.versionNumber,
      changeType: params.changeType,
      contentHash: params.contentHash,
      contentDiff: params.contentDiff,
      changeDescription: params.changeDescription,
      previousVersionId: params.previousVersionId,
      createdBy: params.createdBy,
      createdAt: new Date(),
    });
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: DocumentVersionServerDTO): DocumentVersion {
    return new DocumentVersion({
      id: dto.id,
      documentId: dto.documentId,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      versionNumber: dto.versionNumber,
      changeType: dto.changeType,
      contentHash: dto.contentHash,
      contentDiff: dto.contentDiff,
      changeDescription: dto.changeDescription,
      previousVersionId: dto.previousVersionId,
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: DocumentVersionPersistenceDTO): DocumentVersion {
    return new DocumentVersion({
      id: dto.id,
      documentId: dto.document_id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      versionNumber: dto.version_number,
      changeType: dto.change_type,
      contentHash: dto.content_hash,
      contentDiff: dto.content_diff,
      changeDescription: dto.change_description,
      previousVersionId: dto.previous_version_id,
      createdBy: dto.created_by,
      createdAt: new Date(dto.createdAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新变更描述
   */
  public updateDescription(description: string): void {
    this._changeDescription = description;
  }

  /**
   * 判断是否为首个版本
   */
  public isFirstVersion(): boolean {
    return this._previousVersionId === null;
  }

  /**
   * 判断变更类型是否为编辑
   */
  public isEdit(): boolean {
    return this._changeType === VersionChangeType.Edit;
  }

  /**
   * 判断变更类型是否为创建
   */
  public isCreate(): boolean {
    return this._changeType === VersionChangeType.Create;
  }

  // ===== 序列化方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): DocumentVersionServerDTO {
    return {
      id: this.id,
      documentId: this._documentId,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      versionNumber: this._versionNumber,
      changeType: this._changeType,
      contentHash: this._contentHash,
      contentDiff: this._contentDiff,
      changeDescription: this._changeDescription,
      previousVersionId: this._previousVersionId,
      createdBy: this._createdBy,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): DocumentVersionClientDTO {
    return {
      id: this.id as unknown as string,
      documentId: this._documentId as unknown as string,
      workspaceId: this._workspaceId as unknown as string,
      identityId: this._identityId as unknown as string,
      versionNumber: this._versionNumber,
      changeType: this._changeType,
      contentHash: this._contentHash,
      contentDiff: this._contentDiff,
      changeDescription: this._changeDescription,
      previousVersionId: this._previousVersionId as unknown as string | null,
      createdBy: this._createdBy,
      createdAt: this._createdAt.getTime(),
      formattedCreatedAt: this._createdAt.toLocaleString(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): DocumentVersionPersistenceDTO {
    return {
      id: this.id,
      document_id: this._documentId,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
      version_number: this._versionNumber,
      change_type: this._changeType,
      content_hash: this._contentHash,
      content_diff: this._contentDiff,
      change_description: this._changeDescription,
      previous_version_id: this._previousVersionId,
      created_by: this._createdBy,
      createdAt: this._createdAt,
    };
  }
}
