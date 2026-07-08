/**
 * LinkedResource 实体实现
 */

import { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';
import type { LinkedResourceClientDTO, LinkedResourceServerDTO } from '@dailyuse/contracts/editor';
import type {
  LinkedResourceId,
  EditorWorkspaceId,
  IdentityId,
  ResourceId,
  TransferDate,
} from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils/domain';
import { generateUUID } from '@dailyuse/utils/shared';
import { EditorWorkspaceId as EditorWorkspaceIdType } from '../value-objects/editor-workspace-id';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';

/**
 * LinkedResource 状态接口（domain types）
 */
export interface LinkedResourceState {
  id: LinkedResourceId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  sourceResourceId: ResourceId;
  sourceType: LinkedSourceType;
  sourceLine: number | null;
  sourceColumn: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetResourceId: ResourceId | null;
  targetAnchor: string | null;
  isValid: boolean;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LinkedResource 实体
 */
export class LinkedResource extends Entity<LinkedResourceId> {
  // ===== 私有属性 =====
  private _props: LinkedResourceState;

  // ===== 构造函数（私有） =====
  private constructor(state: LinkedResourceState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }
  public get identityId(): IdentityId {
    return this._props.identityId;
  }
  public get sourceResourceId(): ResourceId {
    return this._props.sourceResourceId;
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
  public get targetResourceId(): ResourceId | null {
    return this._props.targetResourceId;
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
   * 从状态恢复实体
   */
  public static load(state: LinkedResourceState): LinkedResource {
    return new LinkedResource(state);
  }

  /**
   * 创建新的 LinkedResource
   */
  public static create(params: {
    workspaceId: string;
    identityId: string;
    sourceResourceId: string;
    sourceType: LinkedSourceType;
    sourceLine?: number | null;
    sourceColumn?: number | null;
    targetPath: string;
    targetType: LinkedTargetType;
    targetResourceId?: string | null;
    targetAnchor?: string | null;
  }): LinkedResource {
    const id = generateUUID() as LinkedResourceId;
    const now = new Date();

    return new LinkedResource({
      id,
      workspaceId: EditorWorkspaceIdType.of(params.workspaceId),
      identityId: IdentityIdType.of(params.identityId),
      sourceResourceId: params.sourceResourceId as ResourceId,
      sourceType: params.sourceType,
      sourceLine: params.sourceLine ?? null,
      sourceColumn: params.sourceColumn ?? null,
      targetPath: params.targetPath,
      targetType: params.targetType,
      targetResourceId: (params.targetResourceId ?? null) as ResourceId | null,
      targetAnchor: params.targetAnchor ?? null,
      isValid: false,
      lastValidatedAt: null,
      createdAt: now,
      updatedAt: now,
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
   * 更新目标资源 ID（当链接目标是内部资源时）
   */
  public updateTargetResource(resourceId: string | null): void {
    this._props.targetResourceId = resourceId as ResourceId | null;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新源位置（当源资源编辑时）
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
   * 判断是否为内部链接（指向工作区内资源）
   */
  public isInternalLink(): boolean {
    return this._props.targetType === LinkedTargetType.Resource;
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
      sourceResourceId: this._props.sourceResourceId,
      sourceType: this._props.sourceType,
      sourceLine: this._props.sourceLine,
      sourceColumn: this._props.sourceColumn,
      targetPath: this._props.targetPath,
      targetType: this._props.targetType,
      targetResourceId: this._props.targetResourceId,
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
      sourceResourceId: this._props.sourceResourceId,
      sourceType: this._props.sourceType,
      sourceLine: this._props.sourceLine,
      sourceColumn: this._props.sourceColumn,
      targetPath: this._props.targetPath,
      targetType: this._props.targetType,
      targetResourceId: this._props.targetResourceId,
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
}
