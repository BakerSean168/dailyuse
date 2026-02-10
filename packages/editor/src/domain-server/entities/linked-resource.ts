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
import { EditorWorkspaceId as EditorWorkspaceIdType } from '@/domain-shared';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';

/**
 * LinkedResource 内部状态接口
 */
interface LinkedResourceState {
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
}

/**
 * LinkedResource 实体
 */
export class LinkedResource extends Entity<LinkedResourceId> implements LinkedResourceServer {
  // ===== 私有属性 =====
  private _props: LinkedResourceState;

  // ===== 构造函数（私有） =====
  private constructor(id: LinkedResourceId, props: LinkedResourceState) {
    super(id);
    this._props = props;
  }

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }
  public get identityId(): IdentityId {
    return this._props.identityId;
  }
  public get sourceDocumentId(): DocumentId {
    return this._props.sourceDocumentId;
  }
  public get sourceType(): LinkedSourceType {
    return this._props.sourceType;
  }
  public get sourceLine(): number | null {
    return this._props.sourceLine;
  }
  public get sourceColumn(): number | null {
    return this._props.sourceColumn;
  }
  public get targetPath(): string {
    return this._props.targetPath;
  }
  public get targetType(): LinkedTargetType {
    return this._props.targetType;
  }
  public get targetDocumentId(): DocumentId | null {
    return this._props.targetDocumentId;
  }
  public get targetAnchor(): string | null {
    return this._props.targetAnchor;
  }
  public get isValid(): boolean {
    return this._props.isValid;
  }
  public get lastValidatedAt(): Date | null {
    return this._props.lastValidatedAt;
  }
  public get createdAt(): Date {
    return this._props.createdAt;
  }
  public get updatedAt(): Date {
    return this._props.updatedAt;
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

    return new LinkedResource(id, {
      workspaceId: EditorWorkspaceIdType.of(params.workspaceId),
      identityId: IdentityIdType.of(params.identityId),
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
    return new LinkedResource(dto.id, {
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
    return new LinkedResource(dto.id, {
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
    this._props.isValid = true;
    this._props.lastValidatedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 标记为无效（链接失效）
   */
  public markInvalid(): void {
    this._props.isValid = false;
    this._props.lastValidatedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 更新目标路径（当文件移动时）
   */
  public updateTargetPath(newPath: string): void {
    this._props.targetPath = newPath;
    this._props.isValid = false; // 路径变更后需要重新验证
    this._props.updatedAt = new Date();
  }

  /**
   * 更新目标文档 ID（当链接目标是内部文档时）
   */
  public updateTargetDocument(documentId: string | null): void {
    this._props.targetDocumentId = documentId as DocumentId | null;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新源位置（当源文档编辑时）
   */
  public updateSourceLocation(line: number | null, column: number | null): void {
    this._props.sourceLine = line;
    this._props.sourceColumn = column;
    this._props.updatedAt = new Date();
  }

  /**
   * 记录验证时间
   */
  public recordValidation(): void {
    this._props.lastValidatedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 判断是否为内部链接（指向工作区内文档）
   */
  public isInternalLink(): boolean {
    return this._props.targetType === LinkedTargetType.Document;
  }

  /**
   * 判断是否为外部链接
   */
  public isExternalLink(): boolean {
    return this._props.targetType === LinkedTargetType.ExternalUrl;
  }

  /**
   * 判断是否有锚点
   */
  public hasAnchor(): boolean {
    return this._props.targetAnchor !== null && this._props.targetAnchor.length > 0;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): LinkedResourceServerDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      sourceDocumentId: this._props.sourceDocumentId,
      sourceType: this._props.sourceType,
      sourceLine: this._props.sourceLine,
      sourceColumn: this._props.sourceColumn,
      targetPath: this._props.targetPath,
      targetType: this._props.targetType,
      targetDocumentId: this._props.targetDocumentId,
      targetAnchor: this._props.targetAnchor,
      isValid: this._props.isValid,
      lastValidatedAt: this._props.lastValidatedAt?.getTime() as TransferDate | null,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): LinkedResourceClientDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      sourceDocumentId: this._props.sourceDocumentId,
      sourceType: this._props.sourceType,
      sourceLine: this._props.sourceLine,
      sourceColumn: this._props.sourceColumn,
      targetPath: this._props.targetPath,
      targetType: this._props.targetType,
      targetDocumentId: this._props.targetDocumentId,
      targetAnchor: this._props.targetAnchor,
      isValid: this._props.isValid,
      lastValidatedAt: this._props.lastValidatedAt?.getTime() as TransferDate | null,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      formattedLastValidated: this._props.lastValidatedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): LinkedResourcePersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._props.workspaceId,
      identityId: this._props.identityId,
      source_document_id: this._props.sourceDocumentId,
      source_type: this._props.sourceType,
      source_line: this._props.sourceLine,
      source_column: this._props.sourceColumn,
      target_path: this._props.targetPath,
      target_type: this._props.targetType,
      target_document_id: this._props.targetDocumentId,
      target_anchor: this._props.targetAnchor,
      is_valid: this._props.isValid,
      last_validated_at: this._props.lastValidatedAt as PersistenceDate | null,
      createdAt: this._props.createdAt as PersistenceDate,
      updatedAt: this._props.updatedAt as PersistenceDate,
    };
  }
}
