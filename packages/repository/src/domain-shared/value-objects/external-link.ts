/**
 * ExternalLink 值对象
 *
 * 外部链接：URL、标题、来源、快照
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ExternalLink as IExternalLink,
  ExternalLinkDTO,
} from '@dailyuse/contracts/repository';

type LinkSource = 'Youtube' | 'Article' | 'Other';

/**
 * ExternalLink 值对象实现
 */
export class ExternalLink extends ValueObject<ExternalLinkDTO> implements IExternalLink {
  private constructor(props: ExternalLinkDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  public static create(props: ExternalLinkDTO): ExternalLink {
    this.validate(props);
    return new ExternalLink(props);
  }

  public static of(
    url: string,
    title: string,
    source: LinkSource = 'Other',
    snapshotUrl?: string,
  ): ExternalLink {
    return ExternalLink.create({ url, title, source, snapshotUrl });
  }

  public static fromDTO(dto: ExternalLinkDTO): ExternalLink {
    return new ExternalLink(dto);
  }

  // ================= 校验 =================

  private static validate(props: ExternalLinkDTO): void {
    if (!props.url || props.url.trim().length === 0) {
      throw new Error('URL is required');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Title is required');
    }
  }

  // ================= Getters =================

  public get url(): string {
    return this.props.url;
  }

  public get title(): string {
    return this.props.title;
  }

  public get source(): LinkSource {
    return this.props.source;
  }

  public get snapshotUrl(): string | undefined {
    return this.props.snapshotUrl;
  }

  // ================= 行为方法 =================

  public updateTitle(title: string): ExternalLink {
    return new ExternalLink({ ...this.props, title });
  }

  public setSnapshot(snapshotUrl: string | undefined): ExternalLink {
    return new ExternalLink({ ...this.props, snapshotUrl });
  }

  // ================= 计算属性 =================

  public get isYouTube(): boolean {
    return this.props.source === 'Youtube';
  }

  public get isArticle(): boolean {
    return this.props.source === 'Article';
  }

  public get hasSnapshot(): boolean {
    return this.props.snapshotUrl !== undefined && this.props.snapshotUrl.length > 0;
  }

  public get domain(): string {
    try {
      const url = new URL(this.props.url);
      return url.hostname;
    } catch {
      return '';
    }
  }

  // ================= 序列化 =================

  public toDTO(): ExternalLinkDTO {
    return { ...this.props };
  }
}
