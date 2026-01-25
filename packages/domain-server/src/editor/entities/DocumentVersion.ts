/**
 * DocumentVersion 实体实现
 * 实现 DocumentVersionServer 接口
 */

import {
  VersionChangeType,
} from '@dailyuse/contracts/editor';
import type {
  DocumentVersionClientDTO,
  DocumentVersionPersistenceDTO,
  DocumentVersionServer,
  DocumentVersionServerDTO,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';

/**
 * DocumentVersion 实体
 */
export class DocumentVersion extends Entity implements DocumentVersionServer {
  // ===== 私有字段 =====
  private _documentUuid: string;
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _versionNumber: number;
  private _changeType: VersionChangeType;
  private _contentHash: string;
  private _contentDiff: string | null;
  private _changeDescription: string | null;
  private _previousVersionUuid: string | null;
  private _createdBy: string | null;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    documentUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    versionNumber: number;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previousVersionUuid?: string | null;
    createdBy?: string | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._documentUuid = params.documentUuid;
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._versionNumber = params.versionNumber;
    this._changeType = params.changeType;
    this._contentHash = params.contentHash;
    this._contentDiff = params.contentDiff ?? null;
    this._changeDescription = params.changeDescription ?? null;
    this._previousVersionUuid = params.previousVersionUuid ?? null;
    this._createdBy = params.createdBy ?? null;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get documentUuid(): string {
    return this._documentUuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
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
  public get previousVersionUuid(): string | null {
    return this._previousVersionUuid;
  }
  public get createdBy(): string | null {
    return this._createdBy;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新版本
   */
  public static create(params: {
    documentUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    versionNumber: number;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string;
    changeDescription?: string;
    previousVersionUuid?: string;
    createdBy?: string;
  }): DocumentVersion {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    return new DocumentVersion({
      uuid,
      documentUuid: params.documentUuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      versionNumber: params.versionNumber,
      changeType: params.changeType,
      contentHash: params.contentHash,
      contentDiff: params.contentDiff,
      changeDescription: params.changeDescription,
      previousVersionUuid: params.previousVersionUuid,
      createdBy: params.createdBy,
      createdAt: now,
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: DocumentVersionServerDTO): DocumentVersion {
    return new DocumentVersion({
      uuid: dto.uuid,
      documentUuid: dto.documentUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      versionNumber: dto.versionNumber,
      changeType: dto.changeType,
      contentHash: dto.contentHash,
      contentDiff: dto.contentDiff,
      changeDescription: dto.changeDescription,
      previousVersionUuid: dto.previousVersionUuid,
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: DocumentVersionPersistenceDTO): DocumentVersion {
    return new DocumentVersion({
      uuid: dto.uuid,
      documentUuid: dto.document_uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.accountUuid,
      versionNumber: dto.version_number,
      changeType: dto.change_type,
      contentHash: dto.content_hash,
      contentDiff: dto.content_diff,
      changeDescription: dto.change_description,
      previousVersionUuid: dto.previous_version_uuid,
      createdBy: dto.created_by,
      createdAt: new Date(dto.createdAt).getTime(),
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
    return this._versionNumber === 1 || this._previousVersionUuid === null;
  }

  /**
   * 判断变更类型是否为编辑
   */
  public isEditChange(): boolean {
    return this._changeType === VersionChangeType.EDIT;
  }

  /**
   * 判断变更类型是否为创建
   */
  public isCreateChange(): boolean {
    return this._changeType === VersionChangeType.CREATE;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): DocumentVersionServerDTO {
    return {
      uuid: this._uuid,
      documentUuid: this._documentUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      versionNumber: this._versionNumber,
      changeType: this._changeType,
      contentHash: this._contentHash,
      contentDiff: this._contentDiff,
      changeDescription: this._changeDescription,
      previousVersionUuid: this._previousVersionUuid,
      createdBy: this._createdBy,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): DocumentVersionClientDTO {
    return {
      uuid: this._uuid,
      documentUuid: this._documentUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      versionNumber: this._versionNumber,
      changeType: this._changeType,
      contentHash: this._contentHash,
      contentDiff: this._contentDiff,
      changeDescription: this._changeDescription,
      previousVersionUuid: this._previousVersionUuid,
      createdBy: this._createdBy,
      createdAt: this._createdAt.getTime(),
      formattedCreatedAt: new Date(this._createdAt).toLocaleString(),
    };
  }

  public toPersistenceDTO(): DocumentVersionPersistenceDTO {
    return {
      uuid: this._uuid,
      document_uuid: this._documentUuid,
      workspace_uuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      version_number: this._versionNumber,
      change_type: this._changeType,
      content_hash: this._contentHash,
      content_diff: this._contentDiff,
      change_description: this._changeDescription,
      previous_version_uuid: this._previousVersionUuid,
      created_by: this._createdBy,
      createdAt: new Date(this._createdAt),
    };
  }
}
