/**
 * Reminder Group API Requests
 * 提醒分组 API 请求定义
 */

import { z } from 'zod';
import type { ReminderGroupClientDTO } from '../../aggregates';
import type { ControlMode } from '../../value-objects/control-mode';

// ============ Zod Schemas ============

export const CreateReminderGroupRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  controlMode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']).optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateReminderGroupRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  controlMode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']).optional(),
  order: z.number().int().min(0).optional(),
});

export const SwitchGroupControlModeRequestSchema = z.object({
  mode: z.enum(['GROUP_CONTROL', 'INDIVIDUAL_CONTROL']),
});

export const BatchGroupTemplatesRequestSchema = z.object({
  action: z.enum(['ENABLE', 'PAUSE']),
});

// ============ Request Types ============

/**
 * 创建提醒分组请求
 */
export interface CreateReminderGroupRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 更新提醒分组请求
 */
export interface UpdateReminderGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 切换分组控制模式请求
 */
export interface SwitchGroupControlModeRequest {
  mode: ControlMode;
}

/**
 * 批量操作分组模板请求
 */
export interface BatchGroupTemplatesRequest {
  action: 'ENABLE' | 'PAUSE';
}

// ============ Response Types ============

/**
 * 提醒分组详情响应（单个）
 */
export type ReminderGroupDTO = ReminderGroupClientDTO;

/**
 * 提醒分组列表响应
 */
export interface ReminderGroupListDTO {
  groups: ReminderGroupClientDTO[];
  total: number;
}
