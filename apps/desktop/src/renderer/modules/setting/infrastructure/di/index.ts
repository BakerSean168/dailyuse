/**
 * Setting DI Module - Barrel Exports
 *
 * 从 @dailyuse/infrastructure-client 重导出 Container
 */

import { SettingContainer } from '@dailyuse/setting/infrastructure-client';

export { SettingContainer };

// Container singleton instance for stores
// TODO: EPIC-018 后续 Story 中会重构为使用 Hooks 模式
export const settingContainer = SettingContainer.getInstance();
