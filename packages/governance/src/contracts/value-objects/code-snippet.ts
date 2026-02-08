/**
 * CodeSnippet Value Object
 * 代码片段值对象
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@dailyuse/contracts/primitives';
import type { CodeSnippetId } from '@/contracts';
import type { Language } from './language';
import type { SnippetType } from './snippet-type';

// ============ Domain Shape ============

/**
 * CodeSnippet Value Object
 * 代码示例片段
 */
export interface CodeSnippet {
  id: CodeSnippetId;
  language: Language;
  content: string; // Max 10KB
  type: SnippetType;
  caption: string | null; // Max 200 chars
}

// ============ Transfer DTO (传输层) ============

export interface CodeSnippetDTO {
  id: CodeSnippetId;
  language: Language;
  content: string;
  type: SnippetType;
  caption: string | null;
}

// ============ Persistence DTO (持久化层) ============

export interface CodeSnippetPersistenceDTO {
  id: string;
  language: string;
  content: string;
  type: string;
  caption: string | null;
}
