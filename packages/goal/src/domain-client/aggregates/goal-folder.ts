/**
 * GoalFolder Aggregate Root - Domain Client
 * 目标文件夹聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: GoalFolderState): GoalFolder
 * - Instance toDTO(): GoalFolderClientDTO
 */

import type { GoalFolderClientDTO, FolderType } from '@dailyuse/contracts/goal';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { GoalFolderId } from '../../domain-shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export interface GoalFolderState {
  id: GoalFolderId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: GoalFolderId | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType: FolderType | null;
  goalCount: number;
  completedGoalCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class GoalFolder extends AggregateRoot<GoalFolderId> {
  // ================= 1. Props =================
  private readonly _props: GoalFolderState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: GoalFolderState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get icon(): string | null {
    return this._props.icon;
  }

  get color(): string | null {
    return this._props.color;
  }

  get parentFolderId(): GoalFolderId | null {
    return this._props.parentFolderId;
  }

  get sortOrder(): number {
    return this._props.sortOrder;
  }

  get isSystemFolder(): boolean {
    return this._props.isSystemFolder;
  }

  get folderType(): FolderType | null {
    return this._props.folderType;
  }

  get goalCount(): number {
    return this._props.goalCount;
  }

  get completedGoalCount(): number {
    return this._props.completedGoalCount;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // UI 计算属性
  get displayName(): string {
    return this._props.name;
  }

  get displayIcon(): string {
    return this._props.icon ?? '📁';
  }

  get completionRate(): number {
    if (this._props.goalCount === 0) return 0;
    return Math.round((this._props.completedGoalCount / this._props.goalCount) * 100);
  }

  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get activeGoalCount(): number {
    return this._props.goalCount - this._props.completedGoalCount;
  }

  // ================= 4. Factory Methods =================
  public static load(state: GoalFolderState): GoalFolder {
    return new GoalFolder(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalFolderClientDTO {
    return {
      id: String(this.id) as GoalFolderClientDTO['id'],
      identityId: String(this._props.identityId) as GoalFolderClientDTO['identityId'],
      name: this._props.name,
      description: this._props.description,
      icon: this._props.icon,
      color: this._props.color,
      parentFolderId: this._props.parentFolderId
        ? (String(this._props.parentFolderId) as GoalFolderClientDTO['parentFolderId'])
        : null,
      sortOrder: this._props.sortOrder,
      isSystemFolder: this._props.isSystemFolder,
      folderType: this._props.folderType,
      goalCount: this._props.goalCount,
      completedGoalCount: this._props.completedGoalCount,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      displayName: this.displayName,
      displayIcon: this.displayIcon,
      completionRate: this.completionRate,
      activeGoalCount: this.activeGoalCount,
    };
  }
}
