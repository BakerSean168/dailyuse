/**
 * EditorSession - 编辑器会话实体
 *
 * ⚠️ 注意：这是一个实体，不是聚合根
 *
 * 所属聚合根: EditorWorkspace
 * 包含子实体: EditorGroup[]
 *
 * DDD 层次:
 * EditorWorkspace (聚合根)
 *   └── EditorSession (实体)
 *       └── EditorGroup (实体)
 *           └── EditorTab (实体)
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import type {
  EditorSessionClientDTO,
  EditorSessionPersistenceDTO,
  EditorSessionServerDTO,
  SessionLayoutServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';
import { EditorSessionId as EditorSessionIdType } from '../../domain-shared/value-objects/editor-session-id';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';
import { SessionLayout } from '../value-objects/SessionLayout';
import { EditorGroup } from './editor-group';

/**
 * EditorSession 内部状态接口
 */
interface EditorSessionState {
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  layout: SessionLayout;
  isActive: boolean;
  activeGroupIndex: number;
  lastAccessedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorSession extends Entity<EditorSessionId> {
  // ===== 私有属性 =====
  private _props: EditorSessionState;

  // ===== 子实体集合 =====
  private _groups: EditorGroup[] = [];

  private constructor(params: {
    id: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    layout: SessionLayout;
    isActive: boolean;
    activeGroupIndex: number;
    lastAccessedAt: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._props = {
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      name: params.name,
      description: params.description,
      layout: params.layout,
      isActive: params.isActive,
      activeGroupIndex: params.activeGroupIndex,
      lastAccessedAt: params.lastAccessedAt,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    };
  }

  // ===== Getter 属性 =====

  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get groups(): EditorGroup[] {
    return [...this._groups]; // 返回副本
  }

  public get isActive(): boolean {
    return this._props.isActive;
  }

  public get activeGroupIndex(): number {
    return this._props.activeGroupIndex;
  }

  public get layout(): SessionLayout {
    return this._props.layout;
  }

  public get lastAccessedAt(): number | null {
    return this._props.lastAccessedAt;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ===== 实例属性修改方法 =====

  /**
   * 重命名会话
   */
  public rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('会话名称不能为空');
    }
    this._props.name = newName.trim();
    this._props.updatedAt = new Date();
  }

  /**
   * 更新描述
   * @param newDescription 新描述，可以为 null 清除描述
   */
  public updateDescription(newDescription: string | null): void {
    this._props.description = newDescription ? newDescription.trim() : null;
    this._props.updatedAt = new Date();
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 EditorSession
   */
  public static create(params: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description?: string;
    layout?: Partial<SessionLayoutServerDTO>;
  }): EditorSession {
    const id = EditorSessionIdType.of(EditorSessionIdType.generate());
    const now = new Date();

    const layout = params.layout
      ? SessionLayout.fromDTO({
          ...SessionLayout.createDefault().toServerDTO(),
          ...params.layout,
        })
      : SessionLayout.createDefault();

    return new EditorSession({
      id,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      layout,
      isActive: false,
      activeGroupIndex: 0,
      lastAccessedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加分组
   */
  public addGroup(params: { groupIndex: number; name?: string }): EditorGroup {
    const group = EditorGroup.create({
      sessionId: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      groupIndex: params.groupIndex,
      name: params.name,
    });

    this._groups.push(group);
    this.updateTimestamp();

    return group;
  }

  /**
   * 移除分组
   */
  public removeGroup(groupId: string): void {
    const index = this._groups.findIndex((g) => g.id === groupId);
    if (index !== -1) {
      this._groups.splice(index, 1);

      // 调整活动分组索引
      if (this._props.activeGroupIndex >= this._groups.length) {
        this._props.activeGroupIndex = Math.max(0, this._groups.length - 1);
      }

      this.updateTimestamp();
    }
  }

  /**
   * 获取指定分组
   */
  public getGroup(groupId: string): EditorGroup | undefined {
    return this._groups.find((g) => g.id === groupId);
  }

  /**
   * 获取所有分组
   */
  public getAllGroups(): EditorGroup[] {
    return [...this._groups];
  }

  /**
   * 设置活动分组
   */
  public setActiveGroup(groupIndex: number): void {
    if (groupIndex >= 0 && groupIndex < this._groups.length) {
      this._props.activeGroupIndex = groupIndex;
      this.updateTimestamp();
    }
  }

  // ===== 业务方法 =====

  /**
   * 激活会话
   */
  public activate(): void {
    this._props.isActive = true;
    this._props.lastAccessedAt = Date.now();
    this._props.updatedAt = new Date();
  }

  /**
   * 取消激活
   */
  public deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新布局配置
   */
  public updateLayout(layout: Partial<SessionLayoutServerDTO>): void {
    this._props.layout = this._props.layout.with(layout);
    this.updateTimestamp();
  }

  /**
   * 更新会话基本信息
   */
  public update(updates: { name?: string; description?: string | null }): void {
    if (updates.name) {
      this._props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this._props.description = updates.description;
    }
    this.updateTimestamp();
  }

  /**
   * 更新最后访问时间
   */
  public updateLastAccessedAt(): void {
    this._props.lastAccessedAt = Date.now();
    this.updateTimestamp();
  }

  /**
   * 更新时间戳
   */
  private updateTimestamp(): void {
    this._props.updatedAt = new Date();
  }

  // ===== DTO 转换方法 =====

  /**
   * 转换为 Server DTO (递归转换子实体)
   */
  public toServerDTO(): EditorSessionServerDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      groups: this._groups.map((group) => group.toServerDTO()),
      isActive: this._props.isActive,
      activeGroupIndex: this._props.activeGroupIndex,
      layout: this._props.layout.toServerDTO(),
      lastAccessedAt: this._props.lastAccessedAt,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO (递归转换子实体)
   */
  public toClientDTO(): EditorSessionClientDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      groups: this._groups.map((group) => group.toClientDTO()),
      isActive: this._props.isActive,
      activeGroupIndex: this._props.activeGroupIndex,
      layout: this._props.layout.toServerDTO(),
      groupCount: this._groups.length,
      lastAccessedAt: this._props.lastAccessedAt,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO (递归转换子实体)
   */
  public toPersistenceDTO(): EditorSessionPersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      groups: this._groups.map((group) => group.toPersistenceDTO()),
      is_active: this._props.isActive,
      active_group_index: this._props.activeGroupIndex,
      layout: this._props.layout.toPersistenceDTO(),
      lastAccessedAt: this._props.lastAccessedAt !== null ? new Date(this._props.lastAccessedAt) : null,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
    };
  }

  /**
   * 从 Server DTO 创建实体 (递归重建子实体)
   */
  public static fromServerDTO(dto: EditorSessionServerDTO): EditorSession {
    const session = new EditorSession({
      id: dto.id,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      layout: SessionLayout.fromDTO(dto.layout),
      isActive: dto.isActive,
      activeGroupIndex: dto.activeGroupIndex,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });

    // 递归重建子实体
    session._groups = dto.groups.map((groupDto) =>
      EditorGroup.fromServerDTO(groupDto),
    );

    return session;
  }

  /**
   * 从 Client DTO 创建实体 (递归重建子实体)
   */
  public static fromClientDTO(dto: EditorSessionClientDTO): EditorSession {
    const session = new EditorSession({
      id: EditorSessionIdType.of(dto.id),
      workspaceId: dto.workspaceId as EditorWorkspaceId,
      identityId: IdentityIdType.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      layout: SessionLayout.fromDTO(dto.layout),
      isActive: dto.isActive,
      activeGroupIndex: dto.activeGroupIndex,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });

    // 递归重建子实体
    session._groups = dto.groups.map((groupDto) =>
      EditorGroup.fromClientDTO(groupDto),
    );

    return session;
  }

  /**
   * 从 Persistence DTO 创建实体 (递归重建子实体)
   */
  public static fromPersistenceDTO(
    dto: EditorSessionPersistenceDTO,
  ): EditorSession {
    const session = new EditorSession({
      id: dto.id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      layout: SessionLayout.fromPersistenceDTO(dto.layout),
      isActive: dto.is_active,
      activeGroupIndex: dto.active_group_index,
      lastAccessedAt: dto.lastAccessedAt?.getTime() ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归重建子实体
    session._groups = (dto.groups || []).map((groupDto) =>
      EditorGroup.fromPersistenceDTO(groupDto),
    );

    return session;
  }
}
