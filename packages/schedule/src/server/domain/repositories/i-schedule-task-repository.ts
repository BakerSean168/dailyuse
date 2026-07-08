/**
 * IScheduleTaskRepository - Repository Interface
 * ScheduleTask 浠撳偍鎺ュ彛
 *
 * DDD Repository Pattern:
 * - 鎶借薄鑱氬悎鏍圭殑鎸佷箙鍖栭€昏緫
 * - 鎻愪緵绫婚泦鍚堢殑鎿嶄綔鎺ュ彛
 * - 闈㈠悜棰嗗煙妯″瀷锛岃€岄潪鏁版嵁搴撹〃
 *
 * @server/domain/schedule
 */

import type { ScheduleTask } from '../aggregates/schedule-task';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

/**
 * ScheduleTask 鏌ヨ閫夐」
 */
export interface IScheduleTaskQueryOptions {
  identityId?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
  status?: ScheduleTaskStatus;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ScheduleTask 浠撳偍鎺ュ彛
 */
export interface IScheduleTaskRepository {
  // ============ 鍩烘湰 CRUD ============

  /**
   * 淇濆瓨 ScheduleTask 鑱氬悎鏍?
   * - 鏂板缓: INSERT
   * - 鏇存柊: UPDATE (鍩轰簬鐗堟湰鍙疯繘琛屼箰瑙傞攣)
   */
  save(task: ScheduleTask): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘 ScheduleTask
   */
  findById(id: string): Promise<ScheduleTask | null>;

  /**
   * 鏍规嵁 UUID 鍒犻櫎 ScheduleTask
   */
  deleteById(id: string): Promise<void>;

  // ============ 鏌ヨ鏂规硶 ============

  /**
   * 鏌ヨ璐︽埛涓嬬殑鎵€鏈変换鍔?
   */
  findByIdentityId(identityId: string): Promise<ScheduleTask[]>;

  /**
   * 鏌ヨ鎸囧畾鏉ユ簮妯″潡鐨勬墍鏈変换鍔?
   */
  findBySourceModule(module: SourceModule, identityId?: string): Promise<ScheduleTask[]>;

  /**
   * 鏌ヨ鎸囧畾鏉ユ簮瀹炰綋鐨勪换鍔?
   */
  findBySourceEntity(
    module: SourceModule,
    entityId: string,
    identityId?: string,
  ): Promise<ScheduleTask[]>;

  /**
   * 鏌ヨ鎸囧畾鐘舵€佺殑浠诲姟
   */
  findByStatus(status: ScheduleTaskStatus, identityId?: string): Promise<ScheduleTask[]>;

  /**
   * 鏌ヨ鍚敤鐨勪换鍔?
   */
  findEnabled(identityId?: string): Promise<ScheduleTask[]>;

  /**
   * 鏌ヨ闇€瑕佹墽琛岀殑浠诲姟 (鍒版椂闂?+ 宸插惎鐢?+ 娲昏穬鐘舵€?
   */
  findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]>;

  /**
   * 楂樼骇鏌ヨ
   */
  query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]>;

  /**
   * 璁℃暟鏌ヨ
   */
  count(options: IScheduleTaskQueryOptions): Promise<number>;

  // ============ 鎵归噺鎿嶄綔 ============

  /**
   * 鎵归噺淇濆瓨
   */
  saveBatch(tasks: ScheduleTask[]): Promise<void>;

  /**
   * 鎵归噺鍒犻櫎
   */
  deleteBatch(ids: string[]): Promise<void>;

  // ============ 浜嬪姟鏀寔 ============

  /**
   * 鍦ㄤ簨鍔′腑鎵ц鎿嶄綔
   */
  withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T>;
}
