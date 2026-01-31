/**
 * 同步提供者类型
 */
export const SyncProviderType = {
  GithubGist: 'GithubGist',
  Webdav: 'Webdav',
  CustomServer: 'CustomServer',
  LocalFile: 'LocalFile',
} as const;

export type SyncProviderType = (typeof SyncProviderType)[keyof typeof SyncProviderType];
