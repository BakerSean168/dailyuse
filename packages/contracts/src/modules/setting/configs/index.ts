/**
 * Setting configs — Simplified exports
 *
 * The registry now uses category Zod schemas directly for validation.
 * Per-key SettingDefinition constants are no longer needed for core validation.
 */

export {
  validateCategoryPatch,
  validateSettingValue,
} from './setting-registry';
