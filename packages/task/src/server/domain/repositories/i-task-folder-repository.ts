/**
 * TaskFolder 仓储接口
 * 任务文件夹聚合根仓储
 *
 * DDD 仓储职责：
 * - 任务文件夹的持久化
 * - 任务文件夹的查询
 */

import type { TaskFolderServerDTO } from '@dailyuse/contracts/task';

export interface ITaskFolderRepository {
  /**
   * 保存任务文件夹（创建或更新）
   */
  save(folder: TaskFolderServerDTO): Promise<void>;

  /**
   * 根据 ID 查找任务文件夹（系统/内部路径；授权敏感路径请用 findByIdForIdentity）
   */
  findById(id: string): Promise<TaskFolderServerDTO | null>;

  /**
   * 根据 ID + identity 查找任务文件夹（授权敏感读路径）
   */
  findByIdForIdentity(identityId: string, id: string): Promise<TaskFolderServerDTO | null>;

  /**
   * 根据用户 ID 查找所有任务文件夹
   */
  findByIdentityId(identityId: string): Promise<TaskFolderServerDTO[]>;

  /**
   * 删除任务文件夹（必须同时匹配 identity）
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * 检查文件夹是否存在（identity-scoped）
   */
  exists(identityId: string, id: string): Promise<boolean>;
}
