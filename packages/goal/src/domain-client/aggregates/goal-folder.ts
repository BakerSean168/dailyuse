import type { Instant } from '@memoflow/contracts/primitives';
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

import type { GoalFolderClientDTO, FolderType } from '@memoflow/contracts/goal';
import { AggregateRoot } from '@memoflow/utils/domain';
import { GoalFolderId } from '../../server/domain';
import { IdentityId } from '@memoflow/domain-shared/shared';

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
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
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

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Instant {
    const v = this._props.createdAt;
    return v as Instant;
  }

  get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return v as Instant;
  }

  get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
  }

  // UI 计算属性
  get displayName(): string {
    return this._props.name;
  }

  get displayIcon(): string {
    return this._props.icon ?? '📁';
  }

  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
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
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
      displayName: this.displayName,
      displayIcon: this.displayIcon,
    };
  }
}
