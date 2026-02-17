/**
 * User Setting API Client
 * 用户设置 API 客户端
 *
 * 最佳实践：
 * 1. 只发送变化的字段（减少网络传输）
 * 2. 支持部分更新语义
 * 3. 前端乐观更新（先更新 UI，再调用 API）
 */

import { apiClient } from '@/shared/api';
import type { UserSettingClientDTO, UpdateUserSettingReq } from '@dailyuse/contracts/setting';

// 类型别名

/** 
 * 设置更新响应（轻量级）
 * 最佳实践：只返回必要信息，减少网络传输
 */
export interface SettingUpdateResponse {
  ok: boolean;
  updatedAt: number;
  /** 可选：只包含被更新的字段，用于前端验证 */
  updated?: Partial<UpdateUserSettingReq>;
  /** 可选：错误信息 */
  error?: string;
}

/**
 * 获取当前用户设置
 */
export async function getCurrentUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/settings/me');
}

/**
 * 更新当前用户设置（通用方法）
 * 
 * 📝 最佳实践：
 * - 前端只发送变化的字段（例如只改主题时，只发送 { appearance: { theme: 'DARK' } }）
 * - 后端只返回轻量级响应（success + updatedAt），不返回完整对象
 * - 前端使用乐观更新（先更新 UI，API 成功后更新 updatedAt，失败则回滚）
 */
export async function updateUserSettings(
  updates: UpdateUserSettingReq,
): Promise<SettingUpdateResponse> {
  return await apiClient.put<SettingUpdateResponse>('/settings/me', updates);
}

/**
 * 重置用户设置为默认值
 */
export async function resetUserSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.post<UserSettingClientDTO>('/settings/reset');
}

/**
 * 获取默认设置
 */
export async function getDefaultSettings(): Promise<UserSettingClientDTO> {
  return await apiClient.get<UserSettingClientDTO>('/settings/defaults');
}

/**
 * 导出用户设置为 JSON
 */
export async function exportUserSettings(): Promise<Record<string, any>> {
  return await apiClient.get<Record<string, any>>('/settings/export');
}

/**
 * 导入用户设置
 * @param data 导出的设置数据
 * @param options 导入选项
 */
export async function importUserSettings(
  data: Record<string, any>,
  options?: {
    merge?: boolean; // 是否合并现有设置（默认：false，完全替换）
    validate?: boolean; // 是否验证数据（默认：true）
  },
): Promise<UserSettingClientDTO> {
  return await apiClient.post<UserSettingClientDTO>('/settings/import', {
    data,
    options,
  });
}


