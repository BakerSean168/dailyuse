import { LinkedSourceType as LinkedSourceTypeContract, type LinkedSourceType as ILinkedSourceType } from '@dailyuse/contracts/editor';

/**
 * LinkedSourceType 枚举类型
 */

export type LinkedSourceType = ILinkedSourceType & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ILinkedSourceType[] = Object.values(LinkedSourceTypeContract);

export const LinkedSourceType = {
  MarkdownLink: 'MarkdownLink' as LinkedSourceType,
  MarkdownImage: 'MarkdownImage' as LinkedSourceType,
  HtmlAnchor: 'HtmlAnchor' as LinkedSourceType,
  HtmlImage: 'HtmlImage' as LinkedSourceType,
  WikiLink: 'WikiLink' as LinkedSourceType,
  Reference: 'Reference' as LinkedSourceType,

  of(value: string): LinkedSourceType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid LinkedSourceType: ${value}`);
    }
    return value as LinkedSourceType;
  },

  isValid(value: string): value is LinkedSourceType {
    return VALUES.includes(value as ILinkedSourceType);
  },

  getAll(): LinkedSourceType[] {
    return VALUES as LinkedSourceType[];
  },

  isMarkdown(type: LinkedSourceType): boolean {
    return type === this.MarkdownLink || type === this.MarkdownImage;
  },

  isImage(type: LinkedSourceType): boolean {
    return type === this.MarkdownImage || type === this.HtmlImage;
  },
};
