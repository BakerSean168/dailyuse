/**
 * ResourceVersion 实体实现
 */

import { Entity } from '@dailyuse/utils/domain';
import { generateUUID } from '@dailyuse/utils/shared';
import { VersionChangeType } from '@dailyuse/contracts/editor';
import type {
  ResourceVersionClientDTO,
  ResourceVersionServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  ResourceVersionId,
  ResourceId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';

/**
 * ResourceVersion 状态接口（domain types）
 */
export interface ResourceVersionState {
  id: ResourceVersionId;
  resourceId: ResourceId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff: string | null;
  changeDescription: string | null;
  previousVersionId: ResourceVersionId | null;
  createdBy: string | null;
  createdAt: Date;
}

/**
 * ResourceVersion 实体
 */
export class ResourceVersion extends Entity<ResourceVersionId> {
  // ===== 私有属性 =====
  private _props: ResourceVersionState;

  // ===== 构造函数（私有） =====
  private constructor(state: ResourceVersionState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get resourceId(): ResourceId {
    return this._props.resourceId;
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

  public get previousVersionId(): ResourceVersionId | null {
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
  public static load(state: ResourceVersionState): ResourceVersion {
    return new ResourceVersion(state);
  }

  /**
   * 创建新的资源版本
   */
  public static create(params: {
    resourceId: ResourceId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    versionNumber: number;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previousVersionId?: ResourceVersionId | null;
    createdBy?: string | null;
  }): ResourceVersion {
    const id = generateUUID() as ResourceVersionId;
    return new ResourceVersion({
      id,
      resourceId: params.resourceId,
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
    resourceId: ResourceId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    changeType: VersionChangeType;
    contentHash: string;
    contentDiff?: string | null;
    changeDescription?: string | null;
    previous?: ResourceVersion | null;
    createdBy?: string | null;
  }): ResourceVersion {
    const previousVersionId = params.previous?.id ?? null;
    const versionNumber = params.previous ? params.previous.versionNumber + 1 : 1;

    return ResourceVersion.create({
      resourceId: params.resourceId,
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
  public toServerDTO(): ResourceVersionServerDTO {
    return {
      id: this.id,
      resourceId: this._props.resourceId,
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
  public toClientDTO(): ResourceVersionClientDTO {
    return {
      id: this.id,
      resourceId: this._props.resourceId,
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
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
    };
  }
}
