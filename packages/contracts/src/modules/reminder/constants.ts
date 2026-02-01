/**
 * Reminder Module Constants
 * 提醒模块常量定义
 */

import { ControlMode, ReminderStatus } from './value-objects';

/**
 * 根分组（桌面）配置
 * Root Group (Desktop) Configuration
 * 
 * 设计理念：
 * - 所有模板必须属于某个分组，根分组是默认分组
 * - 根分组代表"桌面"，是一个特殊的分组
 * - 通过根分组可以实现全局控制（一键停止所有提醒）
 */
export const ROOT_GROUP_CONFIG = {
  /** 根分组的固定 UUID */
  UUID: '00000000-0000-0000-0000-000000000000',
  
  /** 根分组的显示名称 */
  NAME: '桌面',
  
  /** 根分组的描述 */
  DESCRIPTION: '默认分组，所有未分组的提醒都在这里',
  
  /** 根分组的图标 */
  ICON: 'mdi-apps',
  
  /** 根分组的颜色 */
  COLOR: '#2196F3',
  
  /** 根分组的排序顺序（总是在最前面） */
  ORDER: -1,
  
  /** 根分组的控制模式（默认为独立控制） */
  CONTROL_MODE: ControlMode.Individual,
  
  /** 根分组是否可以删除 */
  CAN_DELETE: false,
  
  /** 根分组是否可以重命名 */
  CAN_RENAME: false,
} as const;

/**
 * 判断是否为根分组
 */
export function isRootGroup(groupUuid: string | null | undefined): boolean {
  return groupUuid === ROOT_GROUP_CONFIG.UUID;
}

/**
 * 获取根分组 UUID
 */
export function getRootGroupUuid(): string {
  return ROOT_GROUP_CONFIG.UUID;
}

/**
 * 判断模板是否在桌面（根分组）
 */
export function isOnDesktop(groupUuid: string | null | undefined): boolean {
  return !groupUuid || groupUuid === ROOT_GROUP_CONFIG.UUID;
}
