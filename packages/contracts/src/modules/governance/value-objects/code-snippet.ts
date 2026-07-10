/**
 * CodeSnippet Value Object
 * 代码片段值对象
 */

import type { CodeSnippetId } from '../primitives/ids';
import type { Language } from './language';
import type { SnippetType } from './snippet-type';

// ============ Transfer DTO (传输层) ============

export interface CodeSnippetDTO {
  id: CodeSnippetId;
  language: Language;
  content: string;
  type: SnippetType;
  caption: string | null;
}

// ============ Persistence DTO (持久化层) ============

/**
 * CodeSnippet Persistence DTO — database storage format.
 * 代码片段持久化 DTO — 数据库存储格式。
 *
 * @internal Repository implementation detail. Consumers should use CodeSnippetDTO.
 * @internal 仓储实现细节，消费者应使用 CodeSnippetDTO。
 */
export interface CodeSnippetPersistenceDTO {
  id: string;
  language: string;
  content: string;
  type: string;
  caption: string | null;
}
