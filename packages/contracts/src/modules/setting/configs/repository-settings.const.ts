/**
 * 仓库设置 (REPOSITORY) - 常量定义
 * ✅ 每个配置项嵌入 Zod Schema
 */
import { z } from 'zod';
import type { SettingDefinition } from '../value-objects';
import { SettingCategory, SettingValueType, UIInputType } from '../value-objects';

export const REPOSITORY_SETTINGS = {
  'repository.defaultStorageLocation': {
    key: 'repository.defaultStorageLocation',
    name: '默认存储位置',
    description: '新仓库的默认存储位置',
    category: SettingCategory.Repository,
    type: SettingValueType.String,
    uiInputType: UIInputType.Select,
    defaultValue: 'local',
    schema: z.enum(['local', 'cloud'] as const),
    isSyncable: true,
    scope: 'USER',
  },

  'repository.imageCompression': {
    key: 'repository.imageCompression',
    name: '图片压缩',
    description: '自动压缩上传的图片',
    category: SettingCategory.Repository,
    type: SettingValueType.Boolean,
    uiInputType: UIInputType.Switch,
    defaultValue: true,
    schema: z.boolean(),
    isSyncable: true,
    scope: 'USER',
  },

  'repository.excludedExtensions': {
    key: 'repository.excludedExtensions',
    name: '排除扩展名',
    description: '不同步的文件扩展名列表',
    category: SettingCategory.Repository,
    type: SettingValueType.Array,
    defaultValue: ['.tmp', '.log', '.DS_Store'],
    schema: z.array(z.string()),
    isSyncable: true,
    scope: 'USER',
  },
} as const satisfies Record<string, SettingDefinition>
