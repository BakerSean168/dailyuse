/**
 * CodeSnippet Value Object
 * 代码片段值对象
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { CodeSnippetId } from '../primitives/ids';
import { Language } from './language';
import { SnippetType } from './snippet-type';

// Residual 731: code snippet dual body retired — OpenAPI + transport use
// CodeSnippetDTOSchema (semantic CodeSnippetDTO is a z.infer alias).
export const CodeSnippetDTOSchema = z.object({
  id: brandedId<CodeSnippetId>(),
  language: z.enum(Language),
  content: z.string(),
  type: z.enum(SnippetType),
  caption: z.string().nullable(),
});

export type CodeSnippetDTO = z.infer<typeof CodeSnippetDTOSchema>;

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
