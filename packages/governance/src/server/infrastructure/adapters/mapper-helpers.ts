/**
 * Mapper Helpers — re-exported from @dailyuse/utils/shared for governance module.
 * 映射器辅助函数 —— 从 @dailyuse/utils/shared 重导出，供治理模块使用。
 *
 * All helper functions are now shared across all modules via @dailyuse/utils/shared.
 * This file re-exports them for backward compatibility with existing imports.
 *
 * 所有辅助函数现已通过 @dailyuse/utils/shared 在所有模块间共享。
 * 本文件重导出它们以保持向后兼容。
 *
 * @see {@link @dailyuse/utils/shared} for the canonical source.
 * @internal Re-export shim — prefer importing from @dailyuse/utils/shared directly.
 */

export {
  extractErrorMessage,
  withCause,
  fromDbDate,
  toDate,
  toDateOrNull,
  parseJson,
  parseStringArray,
  parseRecord,
  escapeSqlLike,
} from '@dailyuse/utils/shared';
