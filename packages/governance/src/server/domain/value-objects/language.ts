/**
 * Language 值对象 — Const Object 枚举模式
 *
 * 【规范说明：Const Object 枚举 - 参考 governance 活文档】
 *
 * 代码片段支持的编程语言类型：
 * - TypeScript：项目主要语言
 * - JSON：配置文件示例
 * - YAML：Docker / CI 配置示例
 * - Prisma：数据库 Schema 示例
 *
 * 【DDD 模式示范】
 * ✅ Branded Type：利用 `unique symbol` 防止原始字符串误用
 * ✅ Const Object 模式：替代 TypeScript enum
 * ✅ Result<T> 模式：工厂方法返回 Result，而非抛异常
 *
 * @see {@link CodeSnippet} 使用 Language 标注代码片段的语言
 */

import { Language as LanguageContract, type Language as ILanguage } from '@memoflow/contracts/governance';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

/** Branded type —— 编译时防止与普通字符串混用 */
export type Language = ILanguage & { readonly __brand: unique symbol };

/** 全部支持的语言 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: ILanguage[] = Object.values(LanguageContract);

/**
 * Language 逻辑对象
 *
 * 提供工厂方法 (`create`)、校验 (`isValid`) 和枚举列举 (`getAll`)。
 */
export const Language = {
  TypeScript: 'TypeScript' as Language,
  JSON: 'JSON' as Language,
  YAML: 'YAML' as Language,
  Prisma: 'Prisma' as Language,

  /**
   * 工厂方法 —— 从原始字符串创建 Language（带校验）
   */
  create(value: string): Result<Language> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid Language: "${value}". Valid values: ${VALUES.join(', ')}`,
      );
    }

    return ok(value as Language);
  },

  /** 判断原始字符串是否为合法语言值 */
  isValid(value: string): value is Language {
    return VALUES.includes(value as ILanguage);
  },

  /** 获取全部支持的语言 */
  getAll(): Language[] {
    return VALUES as Language[];
  },
};

