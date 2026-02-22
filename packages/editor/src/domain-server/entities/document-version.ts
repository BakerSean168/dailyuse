/**
 * DocumentVersion 实体实现
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import {
  VersionChangeType,
} from '@dailyuse/contracts/editor';
import type {
  DocumentVersionClientDTO,
  DocumentVersionServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  DocumentVersionId,
  DocumentId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';

/**
 * DocumentVersion 状态接口（domain types）
 */
export interface DocumentVersionState {
  id: DocumentVersionId;
  documentId: DocumentId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff: string | null;
  changeDescription: string | null;
  previousVersionId: DocumentVersionId | null;
  createdBy: string | null;
  createdAt: Date;
}

/**
 * DocumentVersion 实体
 */
export class DocumentVersion extends Entity<DocumentVersionId> {
  // ===== 私有属性 =====
  private _props: DocumentVersionState;

  // ===== 构造函数（私有） =====
  private constructor(state: DocumentVersionState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get documentId(): DocumentId {
    return this._props.documentId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get versionNumber(): number {
    return this._props.versionNumber;
  }

  public get changeType(): VersionChangeType {
    return this._props.changeType;
  }

  public get contentHash(): string {
    return this._props.contentHash;
  }

  public get contentDiff(): string | null {
    return this._props.contentDiff;
  }

  public get changeDescription(): string | null {
    return this._props.changeDescription;
  }

  public get previousVersionId(): DocumentVersionId | null {
    return this._props.previousVersionId;
  }

  public get createdBy(): string | null {
    return this._props.createdBy;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 从状态恢复实体
   */
  public static load(state: DocumentVersionState): DocumentVersion {
    return new DocumentVersion(state);
  }

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
      contentDiff: params.contentDiff ?? null,
      changeDescription: params.changeDescription ?? null,
      previousVersionId: params.previousVersionId ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * 基于上一版本创建新版本
   */
  public static createNext(params: {
    documentId: DocumentId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previous?: DocumentVersion | null;
    createdBy?: string | null;
  }): DocumentVersion {
    const previousVersionId = params.previous?.id ?? null;
    const versionNumber = params.previous ? params.previous.versionNumber + 1 : 1;

    return DocumentVersion.create({
      documentId: params.documentId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      versionNumber,
      changeType: params.changeType,
      contentHash: params.contentHash,
      contentDiff: params.contentDiff ?? null,
      changeDescription: params.changeDescription ?? null,
      previousVersionId,
      createdBy: params.createdBy ?? null,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新变更描述
   */
  public updateDescription(description: string): void {
    this._props.changeDescription = description;
  }

  /**
   * 判断是否为首个版本
   */
  public isFirstVersion(): boolean {
    return this._props.previousVersionId === null;
  }

  /**
   * 判断变更类型是否为编辑
   */
  public isEdit(): boolean {
    return this._props.changeType === VersionChangeType.Edit;
  }

  /**
   * 判断变更类型是否为创建
   */
  public isCreate(): boolean {
    return this._props.changeType === VersionChangeType.Create;
  }

  // ===== 序列化方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): DocumentVersionServerDTO {
    return {
      id: this.id,
      documentId: this._props.documentId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      versionNumber: this._props.versionNumber,
      changeType: this._props.changeType,
      contentHash: this._props.contentHash,
      contentDiff: this._props.contentDiff,
      changeDescription: this._props.changeDescription,
      previousVersionId: this._props.previousVersionId,
      createdBy: this._props.createdBy,
      createdAt: this._props.createdAt.getTime(),
    };
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): DocumentVersionClientDTO {
    return {
      id: this.id as unknown as string,
      documentId: this._props.documentId as unknown as string,
      workspaceId: this._props.workspaceId as unknown as string,
      identityId: this._props.identityId as unknown as string,
      versionNumber: this._props.versionNumber,
      changeType: this._props.changeType,
      contentHash: this._props.contentHash,
      contentDiff: this._props.contentDiff,
      changeDescription: this._props.changeDescription,
      previousVersionId: this._props.previousVersionId as unknown as string | null,
      createdBy: this._props.createdBy,
      createdAt: this._props.createdAt.getTime(),
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
    };
  }

}
