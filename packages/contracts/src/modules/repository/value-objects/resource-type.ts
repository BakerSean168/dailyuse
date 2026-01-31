/**
 * 资源类型
 */
export const ResourceType = {
  Markdown: 'Markdown',
  Image: 'Image',
  Video: 'Video',
  Audio: 'Audio',
  Pdf: 'Pdf',
  Link: 'Link',
  Code: 'Code',
  Other: 'Other',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
