/**
 * 通知设置 (NOTIFICATION) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory } from '../value-objects';

export const NOTIFICATION_SETTINGS: Record<string, SettingDefinition> = {
  'notification.email': {
    key: 'notification.email',
    name: '邮件通知',
    description: '启用邮件通知',
    category: SettingCategory.NOTIFICATION,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'notification.push': {
    key: 'notification.push',
    name: '推送通知',
    description: '启用推送通知',
    category: SettingCategory.NOTIFICATION,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'notification.sound': {
    key: 'notification.sound',
    name: '声音提醒',
    description: '通知时播放声音',
    category: SettingCategory.NOTIFICATION,
    type: 'BOOLEAN',
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'notification.muteAll': {
    key: 'notification.muteAll',
    name: '禁用所有通知',
    description: '临时禁用所有通知',
    category: SettingCategory.NOTIFICATION,
    type: 'BOOLEAN',
    defaultValue: false,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>;
