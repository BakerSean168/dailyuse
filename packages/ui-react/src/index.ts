/**
 * @dailyuse/ui-react
 *
 * React hooks wrapping @dailyuse/ui-core headless logic.
 * This package provides React hooks that can be used
 * by any React-based UI library (shadcn/ui, Material UI, etc.)
 */

// Re-export core types for convenience
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

// Export core utilities
export {
  VALIDATION_RULES,
  generatePassword,
  isLightColor,
  hexToRgb,
  rgbToHex,
} from '@dailyuse/ui-core';

// Export React hooks
export { useFormValidation, type UseFormValidationReturn } from './hooks/useFormValidation';
export { usePasswordStrength, type UsePasswordStrengthReturn } from './hooks/usePasswordStrength';
export { useLoading, type UseLoadingReturn } from './hooks/useLoading';
export { useMessage, type UseMessageReturn } from './hooks/useMessage';
export { useDialog, type UseDialogReturn } from './hooks/useDialog';
export { useColorPicker, type UseColorPickerReturn } from './hooks/useColorPicker';

// Optional UI bundle (shadcn/ui React components)
export * from '@dailyuse/ui-react-shadcn';
