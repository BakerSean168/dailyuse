/**
 * GoalFolder Aggregate Root - Domain Client
 * 目标文件夹聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 GoalFolderClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: GoalFolderClientDTO): GoalFolder
 * - Instance toDTO(): GoalFolderClientDTO
 */

import type {
  GoalFolderClient,
  GoalFolderClientDTO,
  FolderType,
} from '@dailyuse/contracts/goal';
import { AggregateRoot } from '@dailyuse/utils';
import { GoalFolderId } from '@dailyuse/domain-shared/goal';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class GoalFolder extends AggregateRoot<GoalFolderId> implements GoalFolderClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _icon: string | null;
  private _color: string | null;
  private _parentFolderId: GoalFolderId | null;
  private _sortOrder: number;
  private _isSystemFolder: boolean;
  private _folderType: FolderType | null;
  private _goalCount: number;
  private _completedGoalCount: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
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
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._icon = params.icon;
    this._color = params.color;
    this._parentFolderId = params.parentFolderId;
    this._sortOrder = params.sortOrder;
    this._isSystemFolder = params.isSystemFolder;
    this._folderType = params.folderType;
    this._goalCount = params.goalCount;
    this._completedGoalCount = params.completedGoalCount;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get icon(): string | null {
    return this._icon;
  }

  get color(): string | null {
    return this._color;
  }

  get parentFolderId(): GoalFolderId | null {
    return this._parentFolderId;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get isSystemFolder(): boolean {
    return this._isSystemFolder;
  }

  get folderType(): FolderType | null {
    return this._folderType;
  }

  get goalCount(): number {
    return this._goalCount;
  }

  get completedGoalCount(): number {
    return this._completedGoalCount;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // UI 计算属性
  get displayName(): string {
    return this._name;
  }

  get displayIcon(): string {
    return this._icon ?? '📁';
  }

  get completionRate(): number {
    if (this._goalCount === 0) return 0;
    return Math.round((this._completedGoalCount / this._goalCount) * 100);
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get activeGoalCount(): number {
    return this._goalCount - this._completedGoalCount;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: GoalFolderClientDTO): GoalFolder {
    return new GoalFolder({
      id: GoalFolderId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentFolderId: dto.parentFolderId ? GoalFolderId.of(dto.parentFolderId) : null,
      sortOrder: dto.sortOrder,
      isSystemFolder: dto.isSystemFolder,
      folderType: dto.folderType,
      goalCount: dto.goalCount,
      completedGoalCount: dto.completedGoalCount,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalFolderClientDTO {
    return {
      id: String(this.id) as GoalFolderClientDTO['id'],
      identityId: String(this._identityId) as GoalFolderClientDTO['identityId'],
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentFolderId: this._parentFolderId
        ? (String(this._parentFolderId) as GoalFolderClientDTO['parentFolderId'])
        : null,
      sortOrder: this._sortOrder,
      isSystemFolder: this._isSystemFolder,
      folderType: this._folderType,
      goalCount: this._goalCount,
      completedGoalCount: this._completedGoalCount,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      displayName: this.displayName,
      displayIcon: this.displayIcon,
      completionRate: this.completionRate,
      activeGoalCount: this.activeGoalCount,
    };
  }
}
