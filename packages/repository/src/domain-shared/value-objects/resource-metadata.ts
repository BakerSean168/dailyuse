/**
 * ResourceMetadata 值对象
 *
 * 资源元数据：标签、字数、阅读时间、缩略图
 * 不可变性（所有修改返回新实例）
 *
 * 注意：由于 IResourceMetadata 接口包含索引签名 [key: string]: unknown，
 * TypeScript 类无法直接实现。此类提供相同的属性和方法。
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ResourceMetadataDTO,
} from '@dailyuse/contracts/repository';

/**
 * ResourceMetadata 值对象实现
 */
export class ResourceMetadata extends ValueObject<ResourceMetadataDTO> {
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
      wordCount: null,
      readingTime: null,
      thumbnail: null,
    });
  }

  public static fromDTO(dto: ResourceMetadataDTO): ResourceMetadata {
    return new ResourceMetadata(dto);
  }

  // ================= Getters =================

  public get tags(): string[] {
    return [...this.props.tags];
  }

  public get wordCount(): number | null {
    return this.props.wordCount;
  }

  public get readingTime(): number | null {
    return this.props.readingTime;
  }

  public get thumbnail(): string | null {
    return this.props.thumbnail;
  }

  // ================= 行为方法 =================

  public addTag(tag: string): ResourceMetadata {
    if (this.props.tags.includes(tag)) return this;
    return new ResourceMetadata({
      ...this.props,
      tags: [...this.props.tags, tag],
    });
  }

  public removeTag(tag: string): ResourceMetadata {
    return new ResourceMetadata({
      ...this.props,
      tags: this.props.tags.filter((t) => t !== tag),
    });
  }

  public setWordCount(count: number | null): ResourceMetadata {
    return new ResourceMetadata({ ...this.props, wordCount: count });
  }

  public setThumbnail(url: string | null): ResourceMetadata {
    return new ResourceMetadata({ ...this.props, thumbnail: url });
  }

  public updateReadingTime(): ResourceMetadata {
    // 平均阅读速度：200字/分钟
    const readingTime = this.props.wordCount ? Math.ceil(this.props.wordCount / 200) : null;
    return new ResourceMetadata({ ...this.props, readingTime });
  }

  // ================= 计算属性 =================

  public get hasTags(): boolean {
    return this.props.tags.length > 0;
  }

  public get tagCount(): number {
    return this.props.tags.length;
  }

  public get hasThumbnail(): boolean {
    return this.props.thumbnail !== null;
  }

  public get formattedReadingTime(): string | null {
    if (this.props.readingTime === null) return null;
    if (this.props.readingTime < 1) return '< 1 分钟';
    return `${this.props.readingTime} 分钟`;
  }

  // ================= 序列化 =================

  public toDTO(): ResourceMetadataDTO {
    return {
      ...this.props,
      tags: [...this.props.tags],
      wordCount: this.props.wordCount,
      readingTime: this.props.readingTime,
      thumbnail: this.props.thumbnail,
    };
  }
}
