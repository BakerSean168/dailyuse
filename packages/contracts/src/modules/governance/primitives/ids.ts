/**
 * Governance Module - Branded ID Primitives.
 * 治理模块 - 品牌化 ID 原始类型。
 *
 * 【规范说明：Branded Type 模式】
 * type RuleId = string & { readonly __brand: 'RuleId' }
 *
 * 原理：
 * - 运行时：RuleId 就是 string，零开销
 * - 编译时：TypeScript 将 RuleId 和 RuleRevisionId 视为不同类型
 * - 效果：fn(ruleId: RuleId) 不能接受 RuleRevisionId，防止 ID 意外混用
 *
 * 本文件定义模块私有的 branded ID。公共 branded ID（IdentityId 等）定义在
 * packages/contracts/src/primitives/ids.ts，模块通过 re-export 使用。
 *
 * 参见：docs/standards/id值对象生成id的实现.md
 * 参见：docs/standards/命名约束标识字段统一使用*Id后缀.md
 *
 * 【命名约束】
 * - 统一使用 *Id 后缀（RuleId），禁止 *Uuid 后缀
 * - 文件名 kebab-case，导出符号 PascalCase
 */

export type RuleId = string & { readonly __brand: 'RuleId' };

export type RuleRevisionId = string & { readonly __brand: 'RuleRevisionId' };

export type CodeSnippetId = string & { readonly __brand: 'CodeSnippetId' };
