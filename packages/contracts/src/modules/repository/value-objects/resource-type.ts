/**
 * 资源类型
 * @ResourceType
 * 资源可以是文件或文件夹
 */
export const ResourceType = {
  FILE: 'FILE',
  FOLDER: 'FOLDER',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
