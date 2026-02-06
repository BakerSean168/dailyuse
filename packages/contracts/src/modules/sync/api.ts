/**
 * Sync Module - API Contracts
 * 同步模块 - API 契约定义
 */

import type {
  PullSyncRequest,
  PullSyncResponse,
  PushSyncRequest,
  PushSyncResponse,
  ResolveConflictsRequest,
  ResolveConflictsResponse,
  SyncStatusInfo,
} from './value-objects';

// ============ RPC 方法映射 ============

/**
 * 同步模块 RPC 方法映射
 * 定义客户端和服务端之间的同步 RPC 接口
 */
export interface SyncRpcMap {
  /**
   * 拉取服务端变更
   * 客户端定期调用此接口获取服务端的最新变更
   */
  'sync:pull': {
    request: PullSyncRequest;
    response: PullSyncResponse;
  };

  /**
   * 推送本地变更
   * 客户端将本地变更推送到服务端
   */
  'sync:push': {
    request: PushSyncRequest;
    response: PushSyncResponse;
  };

  /**
   * 解决冲突
   * 客户端提交冲突解决方案
   */
  'sync:resolveConflicts': {
    request: ResolveConflictsRequest;
    response: ResolveConflictsResponse;
  };

  /**
   * 获取同步状态
   * 获取当前用户的同步状态信息
   */
  'sync:getStatus': {
    request: { identityId: string };
    response: SyncStatusInfo;
  };
}

// ============ 事件映射 ============

/**
 * 同步模块事件映射
 * 定义同步相关的实时事件
 */
export interface SyncEventMap {
  /**
   * 服务端有新变更
   * 当服务端检测到其他设备推送了变更时，通知客户端
   */
  'sync:changesAvailable': {
    /** 用户 ID */
    identityId: string;
    /** 变更数量 */
    changesCount: number;
    /** 服务端时间 */
    serverTime: number;
  };

  /**
   * 检测到冲突
   * 当推送变更时检测到冲突
   */
  'sync:conflictDetected': {
    /** 用户 ID */
    identityId: string;
    /** 冲突数量 */
    conflictsCount: number;
  };

  /**
   * 同步完成
   * 一次完整的同步周期完成
   */
  'sync:completed': {
    /** 用户 ID */
    identityId: string;
    /** 拉取的变更数量 */
    pulledCount: number;
    /** 推送的变更数量 */
    pushedCount: number;
    /** 完成时间 */
    completedAt: number;
  };

  /**
   * 同步失败
   * 同步过程中发生错误
   */
  'sync:failed': {
    /** 用户 ID */
    identityId: string;
    /** 错误代码 */
    errorCode: string;
    /** 错误消息 */
    errorMessage: string;
  };
}
