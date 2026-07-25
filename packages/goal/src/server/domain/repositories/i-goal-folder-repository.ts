/**
 * GoalFolder 聚合根仓储接口
 */

import type { GoalFolder } from '../aggregates/goal-folder';

export interface IGoalFolderRepository {
  save(folder: GoalFolder): Promise<void>;
  findByIdForIdentity(identityId: string, id: string): Promise<GoalFolder | null>;
  findByIdentityId(identityId: string): Promise<GoalFolder[]>;
  delete(identityId: string, id: string): Promise<void>;
  exists(identityId: string, id: string): Promise<boolean>;
}
