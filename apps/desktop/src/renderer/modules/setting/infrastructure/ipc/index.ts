/**
 * Setting IPC Module - Barrel Exports
 *
 * 从 @dailyuse/infrastructure-client 重导出 IPC Adapters
 */

export {
  SettingIpcAdapter,
} from '@dailyuse/setting/infrastructure-client';

// 本地类型定义（尚未提取到 contracts）
export * from './setting.ipc-client';
