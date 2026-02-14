/**
 * @dailyuse/ui-vue
 * 
 * Vue 3 组件库的统一聚合导出层
 * 
 * 此包是整个 Vue UI 系统的"总调度中心"，负责：
 * 1. 封装 @dailyuse/ui-core 的纯逻辑为 Vue Composables
 * 2. 统一导出 @dailyuse/ui-vue-shadcn 的所有组件
 * 3. 提供业务层唯一的导入入口
 * 
 * 架构层级：
 *   ui-core (纯 TS 逻辑) 
 *     ↓
 *   ui-vue-shadcn (Vue 组件 + 样式)
 *     ↓
 *   ui-vue (Composables + 聚合导出) ← 你在这里
 *     ↓
 *   apps/desktop (业务代码)
 * 
 * 业务代码使用示例：
 *   import { Button, useFormValidation, useColorPicker } from '@dailyuse/ui-vue';
 */

// ==========================================
// 1. Core Types & Utilities (from ui-core)
// ==========================================
export type {
  ValidationRule,
  ValidationRules,
  PasswordStrengthLevel,
  PasswordStrengthResult,
  LoadingState,
  LoadingStore,
  MessageType,
  MessageOptions,
  MessageState,
  MessageStore,
  DialogState,
  DialogStore,
  ColorPickerState,
  ColorPickerStore,
  UseColorPickerOptions,
} from '@dailyuse/ui-core';

export {
  VALIDATION_RULES,
  generatePassword,
  generateStrongPassword,
  generatePassphrase,
  isLightColor,
  hexToRgb,
  rgbToHex,
} from '@dailyuse/ui-core';

// ==========================================
// 2. Vue Composables (封装 ui-core 逻辑)
// ==========================================
export { useFormValidation, type UseFormValidationReturn } from './composables/useFormValidation';
export { usePasswordStrength, type UsePasswordStrengthReturn } from './composables/usePasswordStrength';
export { useLoading, type UseLoadingReturn } from './composables/useLoading';
export { useMessage, type UseMessageReturn } from './composables/useMessage';
export { useDialog, type UseDialogReturn } from './composables/useDialog';
export { useColorPicker, type UseColorPickerReturn } from './composables/useColorPicker';

// ==========================================
// 3. UI Components (统一导出 ui-vue-shadcn)
// ==========================================
// 这是关键的聚合层！业务代码只需从这里导入组件。
// 如果未来更换底层组件库（如从 shadcn 改为 Element Plus），
// 只需修改下面的导入路径，业务代码无需改动。

export * from '@dailyuse/ui-vue-shadcn';

// ==========================================
// 4. Business Components (业务组件)
// ==========================================
// Authentication Components
// export * from './components/authentication'; // Commented out until implementation confirmed

// Account Components
// export * from './components/account'; // Commented out until implementation confirmed

// Task Components
export * from './components/task';

// ==========================================
// 5. Styles (CSS 变量和 Tailwind)
// ==========================================
// 业务代码应在入口处引入：
// import '@dailyuse/ui-core/styles/globals.css';
