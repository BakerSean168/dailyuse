/**
 * DocumentMetadata 值对象
 * 
 * 文档元数据：标签、分类、字数、阅读时间等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IDocumentMetadataServer,
  DocumentMetadataServerDTO,
  DocumentMetadataPersistenceDTO,
} from '@dailyuse/contracts/editor';

/**
 * DocumentMetadata 值对象实现
 */
export class DocumentMetadata extends ValueObject<DocumentMetadataServerDTO> implements IDocumentMetadataServer {

  private constructor(props: DocumentMetadataServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: DocumentMetadataServerDTO): DocumentMetadata {
    return new DocumentMetadata(props);
  }

  public static createEmpty(): DocumentMetadata {
    return new DocumentMetadata({
      tags: [],
      category: null,
      wordCount: null,
      characterCount: null,
      readingTime: null,
      encoding: 'utf-8',
      language: null,
      customFields: null,
    });
  }

  public static fromDTO(dto: DocumentMetadataServerDTO): DocumentMetadata {
    return new DocumentMetadata(dto);
  }

  public static fromPersistenceDTO(dto: DocumentMetadataPersistenceDTO): DocumentMetadata {
    return new DocumentMetadata({
      tags: JSON.parse(dto.tags),
      category: dto.category,
      wordCount: dto.word_count,
      characterCount: dto.character_count,
      readingTime: dto.reading_time,
      encoding: dto.encoding,
      language: dto.language,
      customFields: dto.custom_fields !== null ? JSON.parse(dto.custom_fields) : null,
    });
  }

  // ================= Getters =================

  public get tags(): string[] {
    return [...this.props.tags];
  }

  public get category(): string | null {
    return this.props.category;
  }

  public get wordCount(): number | null {
    return this.props.wordCount;
  }

  public get characterCount(): number | null {
    return this.props.characterCount;
  }

  public get readingTime(): number | null {
    return this.props.readingTime;
  }

  public get encoding(): string | null {
    return this.props.encoding;
  }

  public get language(): string | null {
    return this.props.language;
  }

  public get customFields(): Record<string, any> | null {
    return this.props.customFields !== undefined && this.props.customFields !== null
      ? { ...this.props.customFields }
      : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<DocumentMetadataServerDTO>,
  ): DocumentMetadata {
    return new DocumentMetadata({ ...this.props, ...updates });
  }

  public addTag(tag: string): DocumentMetadata {
    if (this.props.tags.includes(tag)) return this;
    return this.with({ tags: [...this.props.tags, tag] });
  }

  public removeTag(tag: string): DocumentMetadata {
    return this.with({ tags: this.props.tags.filter(t => t !== tag) });
  }

  public setCategory(category: string | null): DocumentMetadata {
    return this.with({ category });
  }

  public updateStats(wordCount: number, characterCount: number): DocumentMetadata {
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    return this.with({ wordCount, characterCount, readingTime });
  }

  public setCustomField(key: string, value: any): DocumentMetadata {
    const currentFields = this.props.customFields ?? {};
    return this.with({ customFields: { ...currentFields, [key]: value } });
  }

  // ================= 计算属性 =================

  public get hasTags(): boolean {
    return this.props.tags.length > 0;
  }

  public get hasCategory(): boolean {
    return this.props.category !== null;
  }

  public get wordCountFormatted(): string | null {
    if (this.props.wordCount === null) return null;
    return `${this.props.wordCount.toLocaleString()} 字`;
  }

  public get readingTimeFormatted(): string | null {
    if (this.props.readingTime === null) return null;
    return `${this.props.readingTime} 分钟阅读`;
  }

  public get tagsDisplay(): string {
    return this.props.tags.join(', ') || '-';
  }

  // ================= 序列化 =================

  public toServerDTO(): DocumentMetadataServerDTO {
    return {
      tags: [...this.props.tags],
      category: this.props.category,
      wordCount: this.props.wordCount,
      characterCount: this.props.characterCount,
      readingTime: this.props.readingTime,
      encoding: this.props.encoding,
      language: this.props.language,
      customFields: this.props.customFields !== undefined && this.props.customFields !== null
        ? { ...this.props.customFields }
        : null,
    };
  }

  public toPersistenceDTO(): DocumentMetadataPersistenceDTO {
    return {
      tags: JSON.stringify(this.props.tags),
      category: this.props.category,
      word_count: this.props.wordCount,
      character_count: this.props.characterCount,
      reading_time: this.props.readingTime,
      encoding: this.props.encoding,
      language: this.props.language,
      custom_fields: this.props.customFields !== undefined && this.props.customFields !== null
        ? JSON.stringify(this.props.customFields)
        : null,
    };
  }
}
