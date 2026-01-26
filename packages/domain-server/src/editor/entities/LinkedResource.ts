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
import { Entity } from '@dailyuse/utils';

/**
 * LinkedResource 实体
 */
export class LinkedResource extends Entity implements LinkedResourceServer {
  // ===== 私有字段 =====
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _sourceDocumentUuid: string;
  private _sourceType: LinkedSourceType;
  private _sourceLine: number | null;
  private _sourceColumn: number | null;
  private _targetPath: string;
  private _targetType: LinkedTargetType;
  private _targetDocumentUuid: string | null;
  private _targetAnchor: string | null;
  private _isValid: boolean;
  private _lastValidatedAt: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    workspaceUuid: string;
    accountUuid: string;
    sourceDocumentUuid: string;
    sourceType: LinkedSourceType;
    sourceLine?: number | null;
    sourceColumn?: number | null;
    targetPath: string;
    targetType: LinkedTargetType;
    targetDocumentUuid?: string | null;
    targetAnchor?: string | null;
    isValid: boolean;
    lastValidatedAt?: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._sourceDocumentUuid = params.sourceDocumentUuid;
    this._sourceType = params.sourceType;
    this._sourceLine = params.sourceLine ?? null;
    this._sourceColumn = params.sourceColumn ?? null;
    this._targetPath = params.targetPath;
    this._targetType = params.targetType;
    this._targetDocumentUuid = params.targetDocumentUuid ?? null;
    this._targetAnchor = params.targetAnchor ?? null;
    this._isValid = params.isValid;
    this._lastValidatedAt = params.lastValidatedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get sourceDocumentUuid(): string {
    return this._sourceDocumentUuid;
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
  public get targetDocumentUuid(): string | null {
    return this._targetDocumentUuid;
  }
  public get targetAnchor(): string | null {
    return this._targetAnchor;
  }
  public get isValid(): boolean {
    return this._isValid;
  }
  public get lastValidatedAt(): number | null {
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
    workspaceUuid: string;
    accountUuid: string;
    sourceDocumentUuid: string;
    sourceType: LinkedSourceType;
    sourceLine?: number;
    sourceColumn?: number;
    targetPath: string;
    targetType: LinkedTargetType;
    targetDocumentUuid?: string;
    targetAnchor?: string;
  }): LinkedResource {
    const uuid = crypto.randomUUID();
    const now = new Date();

    return new LinkedResource({
      uuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      sourceDocumentUuid: params.sourceDocumentUuid,
      sourceType: params.sourceType,
      sourceLine: params.sourceLine,
      sourceColumn: params.sourceColumn,
      targetPath: params.targetPath,
      targetType: params.targetType,
      targetDocumentUuid: params.targetDocumentUuid,
      targetAnchor: params.targetAnchor,
      isValid: false, // 初始状态为未验证
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: LinkedResourceServerDTO): LinkedResource {
    return new LinkedResource({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      sourceDocumentUuid: dto.sourceDocumentUuid,
      sourceType: dto.sourceType,
      sourceLine: dto.sourceLine,
      sourceColumn: dto.sourceColumn,
      targetPath: dto.targetPath,
      targetType: dto.targetType,
      targetDocumentUuid: dto.targetDocumentUuid,
      targetAnchor: dto.targetAnchor,
      isValid: dto.isValid,
      lastValidatedAt: dto.lastValidatedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: LinkedResourcePersistenceDTO): LinkedResource {
    return new LinkedResource({
      uuid: dto.uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.accountUuid,
      sourceDocumentUuid: dto.source_document_uuid,
      sourceType: dto.source_type,
      sourceLine: dto.source_line,
      sourceColumn: dto.source_column,
      targetPath: dto.target_path,
      targetType: dto.target_type,
      targetDocumentUuid: dto.target_document_uuid,
      targetAnchor: dto.target_anchor,
      isValid: dto.is_valid,
      lastValidatedAt: dto.last_validated_at,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 标记为有效
   */
  public markValid(): void {
    this._isValid = true;
    this._lastValidatedAt = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 标记为无效（链接失效）
   */
  public markInvalid(): void {
    this._isValid = false;
    this._lastValidatedAt = Date.now();
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
   * 更新目标文档 UUID（当链接目标是内部文档时）
   */
  public updateTargetDocument(documentUuid: string | null): void {
    this._targetDocumentUuid = documentUuid;
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
    this._lastValidatedAt = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 判断是否为内部链接（指向工作区内文档）
   */
  public isInternalLink(): boolean {
    return this._targetType === LinkedTargetType.DOCUMENT;
  }

  /**
   * 判断是否为外部链接
   */
  public isExternalLink(): boolean {
    return this._targetType === LinkedTargetType.EXTERNAL_URL;
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
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      sourceDocumentUuid: this._sourceDocumentUuid,
      sourceType: this._sourceType,
      sourceLine: this._sourceLine,
      sourceColumn: this._sourceColumn,
      targetPath: this._targetPath,
      targetType: this._targetType,
      targetDocumentUuid: this._targetDocumentUuid,
      targetAnchor: this._targetAnchor,
      isValid: this._isValid,
      lastValidatedAt: this._lastValidatedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): LinkedResourceClientDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      sourceDocumentUuid: this._sourceDocumentUuid,
      sourceType: this._sourceType,
      sourceLine: this._sourceLine,
      sourceColumn: this._sourceColumn,
      targetPath: this._targetPath,
      targetType: this._targetType,
      targetDocumentUuid: this._targetDocumentUuid,
      targetAnchor: this._targetAnchor,
      isValid: this._isValid,
      lastValidatedAt: this._lastValidatedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      formattedLastValidated: this._lastValidatedAt
        ? new Date(this._lastValidatedAt).toLocaleString()
        : null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): LinkedResourcePersistenceDTO {
    return {
      uuid: this._uuid,
      workspace_uuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      source_document_uuid: this._sourceDocumentUuid,
      source_type: this._sourceType,
      source_line: this._sourceLine,
      source_column: this._sourceColumn,
      target_path: this._targetPath,
      target_type: this._targetType,
      target_document_uuid: this._targetDocumentUuid,
      target_anchor: this._targetAnchor,
      is_valid: this._isValid,
      last_validated_at: this._lastValidatedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
