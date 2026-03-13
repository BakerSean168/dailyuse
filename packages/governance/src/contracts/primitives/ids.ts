/**
 * Governance Module - Branded ID Primitives.
 * 治理模块 - 品牌化 ID 原始类型。
 *
 * Compile-time branded types that prevent accidental ID mix-ups.
 * 编译时品牌化类型，防止 ID 意外混用。
 */

export type RuleId = string & { readonly __brand: 'RuleId' };

export type RuleRevisionId = string & { readonly __brand: 'RuleRevisionId' };

export type CodeSnippetId = string & { readonly __brand: 'CodeSnippetId' };
