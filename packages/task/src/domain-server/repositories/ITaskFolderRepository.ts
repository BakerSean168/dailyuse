/**
 * TaskFolder Repository Interface
 * 任务文件夹仓储接口
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
   * 根据 UUID 查找任务文件夹
   */
  findByUuid(uuid: string): Promise<TaskFolderServerDTO | null>;

  /**
   * 根据账户 UUID 查找所有任务文件夹
   */
  findByAccount(accountUuid: string): Promise<TaskFolderServerDTO[]>;

  /**
   * 删除任务文件夹
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查文件夹是否存在
   */
  exists(uuid: string): Promise<boolean>;
}
