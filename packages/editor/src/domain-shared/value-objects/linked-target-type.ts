import type { LinkedTargetType as ILinkedTargetType } from '@dailyuse/contracts/editor';

/**
 * LinkedTargetType 枚举类型
 */

export type LinkedTargetType = ILinkedTargetType & { readonly __brand: unique symbol };

const VALUES: ILinkedTargetType[] = [
  'Resource',
  'Image',
  'Video',
  'Audio',
  'Archive',
  'ExternalUrl',
  'Anchor',
];

export const LinkedTargetType = {
  Resource: 'Resource' as LinkedTargetType,
  Image: 'Image' as LinkedTargetType,
  Video: 'Video' as LinkedTargetType,
  Audio: 'Audio' as LinkedTargetType,
  Archive: 'Archive' as LinkedTargetType,
  ExternalUrl: 'ExternalUrl' as LinkedTargetType,
  Anchor: 'Anchor' as LinkedTargetType,

  of(value: string): LinkedTargetType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid LinkedTargetType: ${value}`);
    }
    return value as LinkedTargetType;
  },

  isValid(value: string): value is LinkedTargetType {
    return VALUES.includes(value as ILinkedTargetType);
  },

  getAll(): LinkedTargetType[] {
    return VALUES as LinkedTargetType[];
  },

  isMedia(type: LinkedTargetType): boolean {
    return type === this.Image || type === this.Video || type === this.Audio;
  },

  isLocal(type: LinkedTargetType): boolean {
    return type !== this.ExternalUrl;
  },
};
