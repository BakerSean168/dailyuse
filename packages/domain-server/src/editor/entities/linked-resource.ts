/**
 * LinkedResource 实体实现
 * 实现 LinkedResourceServer 接口
 */

import {
  LinkedSourceType,
  LinkedTargetType,
} from '@dailyuse/contracts/editor';
import type {
  LinkedResourceClientDTO,
  LinkedResourcePersistenceDTO,
  LinkedResourceServer,
  LinkedResourceServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  LinkedResourceId,
  EditorWorkspaceId,
  IdentityId,
  DocumentId,
  TransferDate,
  PersistenceDate,
} from '@dailyuse/contracts/primitives';
import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * LinkedResource 实体
 */
export class LinkedResource extends Entity<LinkedResourceId> implements LinkedResourceServer {
  // ===== 私有字段 =====
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _sourceDocumentId: DocumentId;
  private _sourceType: LinkedSourceType;
  private _sourceLine: number | null;
  private _sourceColumn: number | null;
  private _targetPath: string;
  private _targetType: LinkedTargetType;
  private _targetDocumentId: DocumentId | null;
  private _targetAnchor: string | null;
  private _isValid: boolean;
  private _lastValidatedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id: LinkedResourceId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    sourceDocumentId: DocumentId;
    sourceType: LinkedSourceType;
    sourceLine: number | null;
    sourceColumn: number | null;
    targetPath: string;
    targetType: LinkedTargetType;
    targetDocumentId: DocumentId | null;
    targetAnchor: string | null;
    isValid: boolean;
    lastValidatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._sourceDocumentId = params.sourceDocumentId;
    this._sourceType = params.sourceType;
    this._sourceLine = params.sourceLine;
    this._sourceColumn = params.sourceColumn;
    this._targetPath = params.targetPath;
    this._targetType = params.targetType;
    this._targetDocumentId = params.targetDocumentId;
    this._targetAnchor = params.targetAnchor;
    this._isValid = params.isValid;
    this._lastValidatedAt = params.lastValidatedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }
  public get identityId(): IdentityId {
    return this._identityId;
  }
  public get sourceDocumentId(): DocumentId {
    return this._sourceDocumentId;
  }
  public get sourceType(): LinkedSourceType {
    return this._sourceType;
  }
  public get sourceLine(): number | null {
    return this._sourceLine;
  }
  public get sourceColumn(): number | null {
    return this._sourceColumn;
  }
  public get targetPath(): string {
    return this._targetPath;
  }
  public get targetType(): LinkedTargetType {
    return this._targetType;
  }
  public get targetDocumentId(): DocumentId | null {
    return this._targetDocumentId;
  }
  public get targetAnchor(): string | null {
    return this._targetAnchor;
  }
  public get isValid(): boolean {
    return this._isValid;
  }
  public get lastValidatedAt(): Date | null {
    return this._lastValidatedAt;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 LinkedResource
   */
  public static create(params: {
    workspaceId: string;
    identityId: string;
    sourceDocumentId: string;
    sourceType: LinkedSourceType;
    sourceLine?: number | null;
    sourceColumn?: number | null;
    targetPath: string;
    targetType: LinkedTargetType;
    targetDocumentId?: string | null;
    targetAnchor?: string | null;
  }): LinkedResource {
    const id = generateUUID() as LinkedResourceId;
    const now = new Date();

    return new LinkedResource({
      id,
      workspaceId: params.workspaceId as EditorWorkspaceId,
      identityId: params.identityId as IdentityId,
      sourceDocumentId: params.sourceDocumentId as DocumentId,
      sourceType: params.sourceType,
      sourceLine: params.sourceLine ?? null,
      sourceColumn: params.sourceColumn ?? null,
      targetPath: params.targetPath,
      targetType: params.targetType,
      targetDocumentId: (params.targetDocumentId ?? null) as DocumentId | null,
      targetAnchor: params.targetAnchor ?? null,
      isValid: false, // 初始状态为未验证
      lastValidatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: LinkedResourceServerDTO): LinkedResource {
    return new LinkedResource({
      id: dto.id,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      sourceDocumentId: dto.sourceDocumentId,
      sourceType: dto.sourceType,
      sourceLine: dto.sourceLine,
      sourceColumn: dto.sourceColumn,
      targetPath: dto.targetPath,
      targetType: dto.targetType,
      targetDocumentId: dto.targetDocumentId,
      targetAnchor: dto.targetAnchor,
      isValid: dto.isValid,
      lastValidatedAt: dto.lastValidatedAt ? new Date(dto.lastValidatedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: LinkedResourcePersistenceDTO): LinkedResource {
    return new LinkedResource({
      id: dto.id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      sourceDocumentId: dto.source_document_id,
      sourceType: dto.source_type,
      sourceLine: dto.source_line,
      sourceColumn: dto.source_column,
      targetPath: dto.target_path,
      targetType: dto.target_type,
      targetDocumentId: dto.target_document_id,
      targetAnchor: dto.target_anchor,
      isValid: dto.is_valid,
      lastValidatedAt: dto.last_validated_at ? new Date(dto.last_validated_at) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 标记为有效
   */
  public markValid(): void {
    this._isValid = true;
    this._lastValidatedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 标记为无效（链接失效）
   */
  public markInvalid(): void {
    this._isValid = false;
    this._lastValidatedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 更新目标路径（当文件移动时）
   */
  public updateTargetPath(newPath: string): void {
    this._targetPath = newPath;
    this._isValid = false; // 路径变更后需要重新验证
    this._updatedAt = new Date();
  }

  /**
   * 更新目标文档 ID（当链接目标是内部文档时）
   */
  public updateTargetDocument(documentId: string | null): void {
    this._targetDocumentId = documentId as DocumentId | null;
    this._updatedAt = new Date();
  }

  /**
   * 更新源位置（当源文档编辑时）
   */
  public updateSourceLocation(line: number | null, column: number | null): void {
    this._sourceLine = line;
    this._sourceColumn = column;
    this._updatedAt = new Date();
  }

  /**
   * 记录验证时间
   */
  public recordValidation(): void {
    this._lastValidatedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 判断是否为内部链接（指向工作区内文档）
   */
  public isInternalLink(): boolean {
    return this._targetType === LinkedTargetType.Document;
  }

  /**
   * 判断是否为外部链接
   */
  public isExternalLink(): boolean {
    return this._targetType === LinkedTargetType.ExternalUrl;
  }

  /**
   * 判断是否有锚点
   */
  public hasAnchor(): boolean {
    return this._targetAnchor !== null && this._targetAnchor.length > 0;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): LinkedResourceServerDTO {
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      sourceDocumentId: this._sourceDocumentId,
      sourceType: this._sourceType,
      sourceLine: this._sourceLine,
      sourceColumn: this._sourceColumn,
      targetPath: this._targetPath,
      targetType: this._targetType,
      targetDocumentId: this._targetDocumentId,
      targetAnchor: this._targetAnchor,
      isValid: this._isValid,
      lastValidatedAt: this._lastValidatedAt?.getTime() as TransferDate | null,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): LinkedResourceClientDTO {
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      sourceDocumentId: this._sourceDocumentId,
      sourceType: this._sourceType,
      sourceLine: this._sourceLine,
      sourceColumn: this._sourceColumn,
      targetPath: this._targetPath,
      targetType: this._targetType,
      targetDocumentId: this._targetDocumentId,
      targetAnchor: this._targetAnchor,
      isValid: this._isValid,
      lastValidatedAt: this._lastValidatedAt?.getTime() as TransferDate | null,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
      formattedLastValidated: this._lastValidatedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): LinkedResourcePersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
      source_document_id: this._sourceDocumentId,
      source_type: this._sourceType,
      source_line: this._sourceLine,
      source_column: this._sourceColumn,
      target_path: this._targetPath,
      target_type: this._targetType,
      target_document_id: this._targetDocumentId,
      target_anchor: this._targetAnchor,
      is_valid: this._isValid,
      last_validated_at: this._lastValidatedAt as PersistenceDate | null,
      createdAt: this._createdAt as PersistenceDate,
      updatedAt: this._updatedAt as PersistenceDate,
    };
  }
}
