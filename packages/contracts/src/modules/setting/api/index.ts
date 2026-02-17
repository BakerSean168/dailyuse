/**
 * Setting Module API - Request/Response Types
 * 设置模块 API - 请求/响应类型
 */

import type { UserSettingServerDTO } from '../aggregates';
import type { SettingEntryClientDTO } from '../entities';
import type { SettingCategory } from '../value-objects';
import type { IdentityId } from '@/primitives';

// ============ Request Types ============

/**
 * 获取用户设置请求
 */
export interface GetUserSettingRequest {
  readonly identityId?: IdentityId;
}

/**
 * 更新设置项请求
 */
export interface UpdateSettingEntryRequest {
  readonly key: string;
  readonly value: any;
  readonly category?: SettingCategory;
}

/**
 * 批量更新设置项请求
 */
export interface BatchUpdateSettingEntriesRequest {
  readonly entries: Array<{
    readonly key: string;
    readonly value: any;
    readonly category?: SettingCategory;
  }>;
}

/**
 * 删除设置项请求
 */
export interface DeleteSettingEntryRequest {
  readonly key: string;
}

/**
 * 查询设置项请求
 */
export interface QuerySettingEntriesRequest {
  readonly category?: SettingCategory;
  readonly keys?: string[];
  readonly search?: string;
}

/**
 * 重置设置请求
 */
export interface ResetSettingRequest {
  readonly category?: SettingCategory;
  readonly confirmedReset: boolean;
}

// ============ Response Types ============

/**
 * 用户设置响应
 */
export type UserSettingResponse = UserSettingServerDTO;

/**
 * 设置项响应
 */
export type SettingEntryResponse = SettingEntryClientDTO;

/**
 * 批量更新响应
 */
export interface BatchUpdateResponse {
  readonly updated: number;
  readonly failed: number;
  readonly errors?: Array<{ key: string; error: string }>;
}

/**
 * 设置列表响应
 */
export interface SettingListResponse {
  readonly entries: SettingEntryClientDTO[];
  readonly total: number;
}

/**
 * 通用操作响应
 */
export interface SettingOperationResponse {
  readonly ok: boolean;
  readonly message?: string;
}
