/**
 * GitHub Sync Types
 * GitHub 同步相关类型定义
 *
 * 支持通过 GitHub Gist 进行数据同步
 */

import type { SyncProviderConfig } from './sync-provider';

/**
 * GitHub OAuth 范围
 */
export type GitHubOAuthScope = 'gist' | 'read:user' | 'user:email';

/**
 * GitHub OAuth 配置
 */
export interface GitHubOAuthConfig {
  /** OAuth Client ID */
  clientId: string;
  /** OAuth Client Secret (可选，用于服务端流程) */
  clientSecret?: string;
  /** 重定向 URI */
  redirectUri: string;
  /** 授权范围 */
  scopes: GitHubOAuthScope[];
}

/**
 * GitHub OAuth 状态
 */
export interface GitHubOAuthState {
  /** 是否已授权 */
  isAuthorized: boolean;
  /** Access Token */
  accessToken?: string;
  /** Token 过期时间 */
  expiresAt?: number;
  /** 刷新 Token */
  refreshToken?: string;
  /** GitHub 用户信息 */
  user?: GitHubUserInfo;
}

/**
 * GitHub 用户信息
 */
export interface GitHubUserInfo {
  /** GitHub 用户 ID */
  id: number;
  /** 用户名 */
  login: string;
  /** 显示名称 */
  name?: string;
  /** 头像 URL */
  avatarUrl: string;
  /** 邮箱 */
  email?: string;
  /** 主页 URL */
  htmlUrl: string;
}

/**
 * GitHub Gist 文件
 */
export interface GistFile {
  /** 文件名 */
  filename: string;
  /** 文件类型 */
  type?: string;
  /** 语言 */
  language?: string;
  /** 原始内容 URL */
  rawUrl?: string;
  /** 文件大小 */
  size?: number;
  /** 是否被截断 */
  truncated?: boolean;
  /** 文件内容 */
  content?: string;
}

/**
 * GitHub Gist 信息
 */
export interface GistInfo {
  /** Gist ID */
  id: string;
  /** Gist URL */
  url: string;
  /** HTML URL */
  htmlUrl: string;
  /** 描述 */
  description: string;
  /** 是否公开 */
  public: boolean;
  /** 文件列表 */
  files: Record<string, GistFile>;
  /** 所有者 */
  owner?: GitHubUserInfo;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 评论数 */
  comments: number;
}

/**
 * 创建 Gist 请求
 */
export interface CreateGistRequest {
  /** 描述 */
  description: string;
  /** 是否公开 */
  public: boolean;
  /** 文件内容 */
  files: Record<string, { content: string }>;
}

/**
 * 更新 Gist 请求
 */
export interface UpdateGistRequest {
  /** Gist ID */
  gistId: string;
  /** 描述（可选更新） */
  description?: string;
  /** 文件内容 */
  files: Record<string, { content: string } | null>;
}

/**
 * GitHub Gist 同步配置
 */
export interface GitHubGistSyncConfig extends SyncProviderConfig {
  type: 'github-gist';
  /** OAuth 配置 */
  oauth: GitHubOAuthConfig;
  /** OAuth 状态 */
  authState: GitHubOAuthState;
  /** Gist ID（已创建的 Gist） */
  gistId?: string;
  /** Gist 描述 */
  gistDescription: string;
  /** 是否为私密 Gist */
  isPrivate: boolean;
  /** 文件命名前缀 */
  filePrefix: string;
  /** 单文件最大大小（字节） */
  maxFileSize: number;
}

/**
 * GitHub API 错误
 */
export interface GitHubApiError {
  /** 错误消息 */
  message: string;
  /** 文档 URL */
  documentationUrl?: string;
  /** 错误列表 */
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

/**
 * GitHub Gist 文件分割策略
 *
 * 由于 Gist 单文件有大小限制，大数据需要分割成多个文件
 */
export interface GistFileSplitStrategy {
  /** 元数据文件名 */
  metadataFile: string;
  /** 数据文件命名模式 */
  dataFilePattern: string;
  /** 单文件最大大小 */
  maxFileSize: number;
  /** 压缩算法 */
  compression: 'none' | 'gzip' | 'brotli';
}

/**
 * 默认的 Gist 文件分割策略
 */
export const DEFAULT_GIST_SPLIT_STRATEGY: GistFileSplitStrategy = {
  metadataFile: 'dailyuse-sync-metadata.json',
  dataFilePattern: 'dailyuse-sync-data-{index}.json',
  maxFileSize: 1024 * 1024, // 1MB
  compression: 'none',
};

/**
 * GitHub OAuth Token 响应
 */
export interface GitHubOAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
}

/**
 * GitHub Device Flow 响应
 */
export interface GitHubDeviceFlowResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  expiresIn: number;
  interval: number;
}
