/**
 * ResourceMetadata 值对象
 *
 * 资源元数据：标签、分类、字数、阅读时间等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IResourceMetadata,
  ResourceMetadataDTO,
} from '@dailyuse/contracts/editor';

/**
 * ResourceMetadata 值对象实现
 */
export class ResourceMetadata
  extends ValueObject<ResourceMetadataDTO>
  implements IResourceMetadata
{
  private constructor(props: ResourceMetadataDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  public static create(props: ResourceMetadataDTO): ResourceMetadata {
    return new ResourceMetadata(props);
  }

  public static createEmpty(): ResourceMetadata {
    return new ResourceMetadata({
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

  public static fromDTO(dto: ResourceMetadataDTO): ResourceMetadata {
    return new ResourceMetadata(dto);
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

  public with(updates: Partial<ResourceMetadataDTO>): ResourceMetadata {
    return new ResourceMetadata({ ...this.props, ...updates });
  }

  public addTag(tag: string): ResourceMetadata {
    if (this.props.tags.includes(tag)) return this;
    return this.with({ tags: [...this.props.tags, tag] });
  }

  public removeTag(tag: string): ResourceMetadata {
    return this.with({ tags: this.props.tags.filter((t) => t !== tag) });
  }

  public setCategory(category: string | null): ResourceMetadata {
    return this.with({ category });
  }

  public updateStats(wordCount: number, characterCount: number): ResourceMetadata {
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    return this.with({ wordCount, characterCount, readingTime });
  }

  public setCustomField(key: string, value: any): ResourceMetadata {
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

  public toDTO(): ResourceMetadataDTO {
    return {
      tags: [...this.props.tags],
      category: this.props.category,
      wordCount: this.props.wordCount,
      characterCount: this.props.characterCount,
      readingTime: this.props.readingTime,
      encoding: this.props.encoding,
      language: this.props.language,
      customFields:
        this.props.customFields !== undefined && this.props.customFields !== null
          ? { ...this.props.customFields }
          : null,
    };
  }
}
