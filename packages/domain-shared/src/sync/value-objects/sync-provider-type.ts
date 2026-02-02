import type { SyncProviderType as ISyncProviderType } from '@dailyuse/contracts/sync';

/**
 * 📝 同步提供者类型 - 同步的提供者类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncProviderType = ISyncProviderType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncProviderType[] = ['GithubGist', 'Webdav', 'CustomServer', 'LocalFile'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncProviderType = {
  // ================= 常量定义 =================
  
  GithubGist: 'GithubGist' as SyncProviderType,
  Webdav: 'Webdav' as SyncProviderType,
  CustomServer: 'CustomServer' as SyncProviderType,
  LocalFile: 'LocalFile' as SyncProviderType,

  // ================= 工厂方法 =================

  of(value: string): SyncProviderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncProviderType: ${value}`);
    }
    return value as SyncProviderType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncProviderType {
    return VALUES.includes(value as ISyncProviderType);
  },

  // ================= 遍历方法 =================

  getAll(): SyncProviderType[] {
    return VALUES as SyncProviderType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为云服务提供者
   */
  isCloud(value: SyncProviderType): boolean {
    return value === 'GithubGist' || value === 'Webdav' || value === 'CustomServer';
  },

  /**
   * 判断是否为本地存储
   */
  isLocal(value: SyncProviderType): boolean {
    return value === 'LocalFile';
  },

  /**
   * 判断是否为 GitHub Gist
   */
  isGithubGist(value: SyncProviderType): boolean {
    return value === 'GithubGist';
  },

  /**
   * 判断是否为 WebDAV
   */
  isWebdav(value: SyncProviderType): boolean {
    return value === 'Webdav';
  },

  /**
   * 判断是否需要身份验证
   */
  requiresAuth(value: SyncProviderType): boolean {
    return value === 'GithubGist' || value === 'Webdav' || value === 'CustomServer';
  },
};
