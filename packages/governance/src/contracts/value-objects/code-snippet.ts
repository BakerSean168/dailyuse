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
