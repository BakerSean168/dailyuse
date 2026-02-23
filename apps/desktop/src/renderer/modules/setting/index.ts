/**
 * Setting Module - Renderer
 *
 * 设置模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Presentation Layer =====
export {
  useAppSettings,
  type AppSettingsState,
  type UseAppSettingsReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerSettingModule, initializeSettingModule } from './initialization';
