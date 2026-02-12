/**
 * GoalFolder 仓储接口
 */

import type { GoalFolder } from '../aggregates/goal-folder';

export interface IGoalFolderRepository {
  save(folder: GoalFolder): Promise<void>;
  findById(uuid: string): Promise<GoalFolder | null>;
  findByAccountUuid(accountUuid: string): Promise<GoalFolder[]>;
  delete(uuid: string): Promise<void>;
  exists(uuid: string): Promise<boolean>;
}
