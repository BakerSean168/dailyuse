/**
 * 资源类型
 * @ResourceType
 * 资源可以是文件或文件夹
 */
export const ResourceType = {
  File: 'File',
  Folder: 'Folder',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
