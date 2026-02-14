/**
 * Goal Desktop Application Service
 *
 * Facade pattern - 为 IPC handlers 提供统一入口
 * 实际逻辑分散在独立的 service 文件中
 */

import type { CreateGoalRequest, UpdateGoalRequest, GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';

// Import all services
import {
  createGoalService,
  getGoalService,
  listGoalsService,
  updateGoalService,
  deleteGoalService,
  activateGoalService,
  archiveGoalService,
  completeGoalService,
  listGoalFoldersService,
} from './services';

/**
 * Goal Desktop Application Service
 * 作为 facade 层，将请求委托给具体的 service
 */
export class GoalDesktopApplicationService {
  // ===== Goal CRUD =====

  async createGoal(accountUuid: string, params: CreateGoalRequest): Promise<GoalClientDTO> {
    return createGoalService(accountUuid, params);
  }

  async getGoal(uuid: string, includeChildren = true): Promise<GoalClientDTO | null> {
    return getGoalService(uuid, includeChildren);
  }

  async listGoals(params: {
    accountUuid?: string;
    status?: GoalStatus[];
    folderUuid?: string;
    includeChildren?: boolean;
  }): Promise<{ goals: GoalClientDTO[]; total: number }> {
    return listGoalsService(params);
  }

  async updateGoal(uuid: string, params: UpdateGoalRequest): Promise<GoalClientDTO> {
    return updateGoalService(uuid, params);
  }

  async deleteGoal(uuid: string): Promise<void> {
    return deleteGoalService(uuid);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    return activateGoalService(uuid);
  }

  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    return archiveGoalService(uuid);
  }

  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    return completeGoalService(uuid);
  }

  // ===== Goal Folders =====

  async listFolders(params?: {
    accountUuid?: string;
    page?: number;
    limit?: number;
    parentUuid?: string | null;
  }) {
    return listGoalFoldersService({
      accountUuid: params?.accountUuid || 'default-account',
      parentFolderUuid: params?.parentUuid ?? undefined,
    });
  }
}
