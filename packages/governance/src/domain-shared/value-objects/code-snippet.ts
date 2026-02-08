/**
 * CodeSnippet - Value object for code examples
 * 
 * Validates content size (max 10KB) and language support
 */

import { ValueObject } from '@dailyuse/utils/domain';
import { Language } from '../../contracts/value-objects/language';
import { SnippetType } from '../../contracts/value-objects/snippet-type';
import type { Result, ok, fail } from '@dailyuse/contracts/result';

interface CodeSnippetProps {
  id: string;
  language: Language;
  content: string;
  type: SnippetType;
  caption?: string;
}

const MAX_CONTENT_SIZE = 10 * 1024; // 10KB
const MAX_CAPTION_LENGTH = 200;

export class CodeSnippet extends ValueObject<CodeSnippetProps> {
  private constructor(props: CodeSnippetProps) {
    super(props);
  }
  
  /**
   * Creates CodeSnippet with validation
   * 
   * @param props - Snippet properties
   * @returns Result<CodeSnippet> with validation errors if any
   */
  static create(props: Omit<CodeSnippetProps, 'id'> & { id?: string }): Result<CodeSnippet> {
    // Validate content size
    const contentBytes = new Blob([props.content]).size;
    if (contentBytes > MAX_CONTENT_SIZE) {
      return fail(`Code snippet exceeds maximum size of 10KB (current: ${(contentBytes / 1024).toFixed(2)}KB)`);
    }
    
    // Validate content not empty
    if (props.content.trim().length === 0) {
      return fail('Code snippet content cannot be empty');
    }
    
    // Validate caption length
    if (props.caption && props.caption.length > MAX_CAPTION_LENGTH) {
      return fail(`Caption exceeds maximum length of ${MAX_CAPTION_LENGTH} characters`);
    }
    
    // Validate language
    if (!Object.values(Language).includes(props.language)) {
      return fail(`Unsupported language: ${props.language}`);
    }
    
    // Validate snippet type
    if (!Object.values(SnippetType).includes(props.type)) {
      return fail(`Invalid snippet type: ${props.type}`);
    }
    
    return ok(new CodeSnippet({
      id: props.id || crypto.randomUUID(),
      language: props.language,
      content: props.content,
      type: props.type,
      caption: props.caption,
    }));
  }
  
  get id(): string {
    return this.props.id;
  }
  
  get language(): Language {
    return this.props.language;
  }
  
  get content(): string {
    return this.props.content;
  }
  
  get type(): SnippetType {
    return this.props.type;
  }
  
  get caption(): string | undefined {
    return this.props.caption;
  }
}
