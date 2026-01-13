/**
 * GitHubGistSyncProvider - GitHub Gist 同步提供者
 *
 * 使用 GitHub Gist 作为数据同步的云端存储：
 * - 支持 GitHub OAuth 认证
 * - 将同步数据存储在私有 Gist 中
 * - 支持大数据分割存储
 *
 * 数据结构：
 * - metadata.json: 同步元数据
 * - data-goals.json: 目标数据
 * - data-tasks.json: 任务数据
 * - data-schedules.json: 日程数据
 * - data-reminders.json: 提醒数据
 * - data-settings.json: 设置数据
 */

import { EventEmitter } from 'events';
import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  ISyncProvider,
  SyncProviderType,
  SyncPayload,
  SyncResult,
  SyncMetadata,
  SyncDataBundle,
  SyncOperation,
  GitHubGistSyncConfig,
  GitHubOAuthState,
  GitHubUserInfo,
  GistInfo,
  GistFile,
  CreateGistRequest,
  UpdateGistRequest,
} from '@dailyuse/contracts/sync';
import { SYNC_DATA_FORMAT_VERSION, DEFAULT_GIST_SPLIT_STRATEGY } from '@dailyuse/contracts/sync';
import { shell, BrowserWindow } from 'electron';
import * as https from 'https';
import * as http from 'http';
import * as url from 'url';

// Re-export types
export type { GitHubGistSyncConfig, GitHubOAuthState, GitHubUserInfo, GistInfo };

/**
 * GitHub Gist 同步提供者配置
 */
export interface GitHubGistProviderOptions {
  /** OAuth Client ID */
  clientId: string;
  /** OAuth Client Secret (可选) */
  clientSecret?: string;
  /** 重定向 URI */
  redirectUri?: string;
  /** Gist 描述 */
  gistDescription?: string;
  /** 是否使用私有 Gist */
  isPrivate?: boolean;
  /** 本地回调端口 */
  localCallbackPort?: number;
}

const DEFAULT_OPTIONS: Required<Omit<GitHubGistProviderOptions, 'clientId' | 'clientSecret'>> = {
  redirectUri: 'http://localhost:9876/callback',
  gistDescription: 'DailyUse Sync Data - DO NOT EDIT',
  isPrivate: true,
  localCallbackPort: 9876,
};

// GitHub API 常量
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// Gist 文件名
const FILE_NAMES = {
  metadata: 'dailyuse-metadata.json',
  goals: 'dailyuse-data-goals.json',
  tasks: 'dailyuse-data-tasks.json',
  schedules: 'dailyuse-data-schedules.json',
  reminders: 'dailyuse-data-reminders.json',
  settings: 'dailyuse-data-settings.json',
};

/**
 * GitHub Gist 同步提供者
 *
 * 实现 ISyncProvider 接口，使用 GitHub Gist 存储同步数据
 */
export class GitHubGistSyncProvider extends EventEmitter implements ISyncProvider {
  readonly type: SyncProviderType = 'github-gist';
  readonly name = 'GitHub Gist';

  private readonly logger: ILogger;
  private readonly options: Required<GitHubGistProviderOptions>;

  // OAuth 状态
  private authState: GitHubOAuthState = {
    isAuthorized: false,
  };

  // Gist 信息
  private gistId: string | null = null;

  // OAuth 回调服务器
  private callbackServer: http.Server | null = null;
  private pendingAuthResolve: ((token: string) => void) | null = null;
  private pendingAuthReject: ((error: Error) => void) | null = null;

  constructor(options: GitHubGistProviderOptions, logger?: ILogger) {
    super();
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<GitHubGistProviderOptions>;
    this.logger = logger || createLogger('GitHubGistSyncProvider');
  }

  // ============ ISyncProvider 实现 ============

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.authState.isAuthorized && !!this.authState.accessToken;
  }

  /**
   * 初始化提供者
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing GitHub Gist Sync Provider');
    // 可以在这里加载保存的认证状态
  }

  /**
   * 连接/认证
   */
  async connect(): Promise<boolean> {
    if (this.isConnected()) {
      this.logger.info('Already connected');
      return true;
    }

    try {
      // 启动 OAuth 流程
      const accessToken = await this.startOAuthFlow();

      if (!accessToken) {
        return false;
      }

      // 验证 token 并获取用户信息
      const userInfo = await this.getUserInfo(accessToken);

      if (!userInfo) {
        return false;
      }

      this.authState = {
        isAuthorized: true,
        accessToken,
        user: userInfo,
      };

      // 查找或创建 Gist
      await this.findOrCreateGist();

      this.emit('connection:changed', { connected: true });
      this.logger.info('Connected successfully', { user: userInfo.login });

      return true;
    } catch (error) {
      this.logger.error('Connection failed', { error });
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.authState = { isAuthorized: false };
    this.gistId = null;
    this.emit('connection:changed', { connected: false });
    this.logger.info('Disconnected');
  }

  /**
   * 推送数据到 Gist
   */
  async push(payload: SyncPayload): Promise<SyncResult> {
    const operation: SyncOperation = 'push';

    if (!this.isConnected()) {
      return this.createErrorResult(operation, 'Not connected');
    }

    try {
      // 准备文件内容
      const files = this.prepareGistFiles(payload);

      if (this.gistId) {
        // 更新现有 Gist
        await this.updateGist(this.gistId, files);
      } else {
        // 创建新 Gist
        const gistInfo = await this.createGist(files);
        this.gistId = gistInfo.id;
      }

      this.logger.info('Push completed', { gistId: this.gistId });

      return {
        success: true,
        operation,
        syncedCount: this.countEntities(payload.data),
        conflictCount: 0,
        newVersion: payload.metadata.version,
        timestamp: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(operation, message);
    }
  }

  /**
   * 从 Gist 拉取数据
   */
  async pull(): Promise<SyncPayload | null> {
    if (!this.isConnected()) {
      throw new Error('Not connected');
    }

    if (!this.gistId) {
      // 尝试查找 Gist
      const found = await this.findExistingGist();
      if (!found) {
        this.logger.info('No existing Gist found');
        return null;
      }
    }

    try {
      // 获取 Gist 内容
      const gistInfo = await this.getGist(this.gistId!);

      if (!gistInfo) {
        return null;
      }

      // 解析数据
      const payload = this.parseGistToPayload(gistInfo);

      this.logger.info('Pull completed', { version: payload?.metadata.version });

      return payload;
    } catch (error) {
      this.logger.error('Pull failed', { error });
      throw error;
    }
  }

  /**
   * 获取远程元数据
   */
  async getRemoteMetadata(): Promise<SyncMetadata | null> {
    if (!this.isConnected() || !this.gistId) {
      return null;
    }

    try {
      const gistInfo = await this.getGist(this.gistId);

      if (!gistInfo || !gistInfo.files[FILE_NAMES.metadata]) {
        return null;
      }

      const content = gistInfo.files[FILE_NAMES.metadata].content;
      if (!content) {
        return null;
      }

      return JSON.parse(content) as SyncMetadata;
    } catch (error) {
      this.logger.error('Failed to get remote metadata', { error });
      return null;
    }
  }

  /**
   * 清空远程数据
   */
  async clear(): Promise<void> {
    if (!this.isConnected() || !this.gistId) {
      return;
    }

    try {
      await this.deleteGist(this.gistId);
      this.gistId = null;
      this.logger.info('Remote data cleared');
    } catch (error) {
      this.logger.error('Failed to clear remote data', { error });
      throw error;
    }
  }

  // ============ OAuth 流程 ============

  /**
   * 启动 OAuth 流程
   */
  private async startOAuthFlow(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.pendingAuthResolve = resolve;
      this.pendingAuthReject = reject;

      // 启动本地回调服务器
      this.startCallbackServer();

      // 构建授权 URL
      const authUrl = new URL(GITHUB_AUTH_URL);
      authUrl.searchParams.set('client_id', this.options.clientId);
      authUrl.searchParams.set('redirect_uri', this.options.redirectUri);
      authUrl.searchParams.set('scope', 'gist read:user');
      authUrl.searchParams.set('state', this.generateState());

      // 打开浏览器进行授权
      shell.openExternal(authUrl.toString());

      // 设置超时
      setTimeout(() => {
        if (this.pendingAuthReject) {
          this.stopCallbackServer();
          this.pendingAuthReject(new Error('OAuth timeout'));
          this.pendingAuthResolve = null;
          this.pendingAuthReject = null;
        }
      }, 5 * 60 * 1000); // 5 分钟超时
    });
  }

  /**
   * 启动 OAuth 回调服务器
   */
  private startCallbackServer(): void {
    this.callbackServer = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);

      if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code as string;

        if (code) {
          try {
            // 交换 code 获取 access token
            const accessToken = await this.exchangeCodeForToken(code);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h1>✅ 授权成功！</h1>
                  <p>您可以关闭此窗口并返回 DailyUse。</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);

            if (this.pendingAuthResolve) {
              this.pendingAuthResolve(accessToken);
              this.pendingAuthResolve = null;
              this.pendingAuthReject = null;
            }
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h1>❌ 授权失败</h1>
                  <p>${error instanceof Error ? error.message : '未知错误'}</p>
                </body>
              </html>
            `);

            if (this.pendingAuthReject) {
              this.pendingAuthReject(error instanceof Error ? error : new Error(String(error)));
              this.pendingAuthResolve = null;
              this.pendingAuthReject = null;
            }
          }
        } else {
          res.writeHead(400);
          res.end('Missing authorization code');
        }

        // 延迟关闭服务器
        setTimeout(() => this.stopCallbackServer(), 1000);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.callbackServer.listen(this.options.localCallbackPort, () => {
      this.logger.info('OAuth callback server started', { port: this.options.localCallbackPort });
    });
  }

  /**
   * 停止回调服务器
   */
  private stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close();
      this.callbackServer = null;
      this.logger.info('OAuth callback server stopped');
    }
  }

  /**
   * 交换授权码获取 access token
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret || '',
      code,
      redirect_uri: this.options.redirectUri,
    });

    const response = await this.httpRequest<{ access_token: string; token_type: string; scope: string }>({
      method: 'POST',
      url: GITHUB_TOKEN_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.access_token) {
      throw new Error('Failed to get access token');
    }

    return response.access_token;
  }

  /**
   * 生成 OAuth state 参数
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // ============ GitHub API 调用 ============

  /**
   * 获取用户信息
   */
  private async getUserInfo(accessToken: string): Promise<GitHubUserInfo | null> {
    try {
      const response = await this.apiRequest<{
        id: number;
        login: string;
        name: string;
        avatar_url: string;
        email: string;
        html_url: string;
      }>('/user', 'GET', accessToken);

      return {
        id: response.id,
        login: response.login,
        name: response.name,
        avatarUrl: response.avatar_url,
        email: response.email,
        htmlUrl: response.html_url,
      };
    } catch (error) {
      this.logger.error('Failed to get user info', { error });
      return null;
    }
  }

  /**
   * 查找或创建 Gist
   */
  private async findOrCreateGist(): Promise<void> {
    // 先尝试查找现有的 Gist
    const found = await this.findExistingGist();

    if (found) {
      this.logger.info('Found existing Gist', { gistId: this.gistId });
    } else {
      this.logger.info('No existing Gist found, will create on first push');
    }
  }

  /**
   * 查找已存在的同步 Gist
   */
  private async findExistingGist(): Promise<boolean> {
    if (!this.authState.accessToken) return false;

    try {
      const gists = await this.apiRequest<Array<{
        id: string;
        description: string;
        files: Record<string, { filename: string }>;
      }>>('/gists', 'GET', this.authState.accessToken);

      // 查找包含同步元数据文件的 Gist
      const syncGist = gists.find(
        (gist) =>
          gist.description === this.options.gistDescription ||
          gist.files[FILE_NAMES.metadata]
      );

      if (syncGist) {
        this.gistId = syncGist.id;
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to find existing Gist', { error });
      return false;
    }
  }

  /**
   * 创建 Gist
   */
  private async createGist(files: Record<string, { content: string }>): Promise<GistInfo> {
    if (!this.authState.accessToken) {
      throw new Error('Not authenticated');
    }

    const request: CreateGistRequest = {
      description: this.options.gistDescription,
      public: !this.options.isPrivate,
      files,
    };

    const response = await this.apiRequest<{
      id: string;
      url: string;
      html_url: string;
      description: string;
      public: boolean;
      files: Record<string, GistFile>;
      created_at: string;
      updated_at: string;
      comments: number;
    }>('/gists', 'POST', this.authState.accessToken, request);

    return {
      id: response.id,
      url: response.url,
      htmlUrl: response.html_url,
      description: response.description,
      public: response.public,
      files: response.files,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      comments: response.comments,
    };
  }

  /**
   * 更新 Gist
   */
  private async updateGist(gistId: string, files: Record<string, { content: string }>): Promise<void> {
    if (!this.authState.accessToken) {
      throw new Error('Not authenticated');
    }

    await this.apiRequest(`/gists/${gistId}`, 'PATCH', this.authState.accessToken, { files });
  }

  /**
   * 获取 Gist
   */
  private async getGist(gistId: string): Promise<GistInfo | null> {
    if (!this.authState.accessToken) {
      return null;
    }

    try {
      const response = await this.apiRequest<{
        id: string;
        url: string;
        html_url: string;
        description: string;
        public: boolean;
        files: Record<string, GistFile>;
        created_at: string;
        updated_at: string;
        comments: number;
      }>(`/gists/${gistId}`, 'GET', this.authState.accessToken);

      return {
        id: response.id,
        url: response.url,
        htmlUrl: response.html_url,
        description: response.description,
        public: response.public,
        files: response.files,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        comments: response.comments,
      };
    } catch (error) {
      this.logger.error('Failed to get Gist', { gistId, error });
      return null;
    }
  }

  /**
   * 删除 Gist
   */
  private async deleteGist(gistId: string): Promise<void> {
    if (!this.authState.accessToken) {
      throw new Error('Not authenticated');
    }

    await this.apiRequest(`/gists/${gistId}`, 'DELETE', this.authState.accessToken);
  }

  // ============ 数据转换 ============

  /**
   * 准备 Gist 文件
   */
  private prepareGistFiles(payload: SyncPayload): Record<string, { content: string }> {
    const files: Record<string, { content: string }> = {};

    // 元数据
    files[FILE_NAMES.metadata] = {
      content: JSON.stringify(payload.metadata, null, 2),
    };

    // 各类数据
    if (payload.data.goals) {
      files[FILE_NAMES.goals] = {
        content: JSON.stringify(payload.data.goals, null, 2),
      };
    }

    if (payload.data.tasks) {
      files[FILE_NAMES.tasks] = {
        content: JSON.stringify(payload.data.tasks, null, 2),
      };
    }

    if (payload.data.schedules) {
      files[FILE_NAMES.schedules] = {
        content: JSON.stringify(payload.data.schedules, null, 2),
      };
    }

    if (payload.data.reminders) {
      files[FILE_NAMES.reminders] = {
        content: JSON.stringify(payload.data.reminders, null, 2),
      };
    }

    if (payload.data.settings) {
      files[FILE_NAMES.settings] = {
        content: JSON.stringify(payload.data.settings, null, 2),
      };
    }

    return files;
  }

  /**
   * 解析 Gist 为 SyncPayload
   */
  private parseGistToPayload(gistInfo: GistInfo): SyncPayload | null {
    try {
      const metadataFile = gistInfo.files[FILE_NAMES.metadata];
      if (!metadataFile?.content) {
        return null;
      }

      const metadata = JSON.parse(metadataFile.content) as SyncMetadata;

      const data: SyncDataBundle = {
        goals: this.parseFileContent(gistInfo.files[FILE_NAMES.goals]) || [],
        tasks: this.parseFileContent(gistInfo.files[FILE_NAMES.tasks]) || [],
        schedules: this.parseFileContent(gistInfo.files[FILE_NAMES.schedules]) || [],
        reminders: this.parseFileContent(gistInfo.files[FILE_NAMES.reminders]) || [],
        settings: this.parseFileContent(gistInfo.files[FILE_NAMES.settings]) || undefined,
      };

      return {
        formatVersion: SYNC_DATA_FORMAT_VERSION,
        metadata,
        data,
      };
    } catch (error) {
      this.logger.error('Failed to parse Gist to payload', { error });
      return null;
    }
  }

  /**
   * 解析文件内容
   */
  private parseFileContent<T>(file?: GistFile): T | null {
    if (!file?.content) return null;
    try {
      return JSON.parse(file.content) as T;
    } catch {
      return null;
    }
  }

  // ============ HTTP 工具 ============

  /**
   * GitHub API 请求
   */
  private async apiRequest<T>(
    endpoint: string,
    method: string,
    accessToken: string,
    body?: unknown
  ): Promise<T> {
    return this.httpRequest<T>({
      method,
      url: `${GITHUB_API_BASE}${endpoint}`,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'DailyUse-Desktop',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * HTTP 请求封装
   */
  private httpRequest<T>(options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(options.url);

      const requestOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method,
        headers: options.headers,
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              if (data) {
                resolve(JSON.parse(data) as T);
              } else {
                resolve({} as T);
              }
            } catch {
              resolve(data as unknown as T);
            }
          } else if (res.statusCode === 204) {
            resolve({} as T);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  // ============ 辅助方法 ============

  /**
   * 创建错误结果
   */
  private createErrorResult(operation: SyncOperation, error: string): SyncResult {
    return {
      success: false,
      operation,
      syncedCount: 0,
      conflictCount: 0,
      error,
      timestamp: Date.now(),
    };
  }

  /**
   * 计算实体数量
   */
  private countEntities(data: SyncDataBundle): number {
    return (
      (data.goals?.length || 0) +
      (data.tasks?.length || 0) +
      (data.schedules?.length || 0) +
      (data.reminders?.length || 0)
    );
  }

  // ============ 公开方法 ============

  /**
   * 获取当前认证状态
   */
  getAuthState(): GitHubOAuthState {
    return { ...this.authState };
  }

  /**
   * 设置 Access Token（用于恢复已保存的认证）
   */
  async setAccessToken(accessToken: string): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo(accessToken);

      if (!userInfo) {
        return false;
      }

      this.authState = {
        isAuthorized: true,
        accessToken,
        user: userInfo,
      };

      await this.findOrCreateGist();

      this.emit('connection:changed', { connected: true });
      return true;
    } catch (error) {
      this.logger.error('Failed to set access token', { error });
      return false;
    }
  }

  /**
   * 获取 Gist ID
   */
  getGistId(): string | null {
    return this.gistId;
  }

  /**
   * 设置 Gist ID（用于恢复已保存的状态）
   */
  setGistId(gistId: string): void {
    this.gistId = gistId;
  }
}

/**
 * 创建 GitHub Gist 同步提供者
 */
export function createGitHubGistSyncProvider(
  options: GitHubGistProviderOptions,
  logger?: ILogger
): GitHubGistSyncProvider {
  return new GitHubGistSyncProvider(options, logger);
}
