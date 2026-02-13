/**
 * GoalFolder 聚合根仓储接口
 */

import type { GoalFolder } from '../aggregates/goal-folder';

export interface IGoalFolderRepository {
  save(folder: GoalFolder): Promise<void>;
  findById(id: string): Promise<GoalFolder | null>;
  findByIdentityId(identityId: string): Promise<GoalFolder[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
