/**
 * Key Result Snapshot Value Object
 * 关键成果快照值对象（用于复盘记录）
 */

// ============ 接口定义 ============

/**
 * 关键成果快照 - Server 接口
 */
export interface IKeyResultSnapshotServer {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;

  // 值对象方法
  equals(other: IKeyResultSnapshotServer): boolean;
  with(
    updates: Partial<
      Omit<
        IKeyResultSnapshotServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IKeyResultSnapshotServer;

  // DTO 转换方法}

/**
 * 关键成果快照 - Client 接口
 */
export interface IKeyResultSnapshotClient {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;

  // 值对象方法
  equals(other: IKeyResultSnapshotClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Key Result Snapshot Server DTO
 */
export interface KeyResultSnapshotServerDTO {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}

/**
 * Key Result Snapshot Client DTO
 */
export interface KeyResultSnapshotClientDTO {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}

/**
 * Key Result Snapshot Persistence DTO
 */
export interface KeyResultSnapshotPersistenceDTO {
  keyResultUuid: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}

// ============ 类型导出 ============

export type KeyResultSnapshotServer = IKeyResultSnapshotServer;
export type KeyResultSnapshotClient = IKeyResultSnapshotClient;
