/**
 * Provider Authentication Services
 *
 * 提供者认证用例（GitHub OAuth 等）
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type {
  GitHubOAuthStartResponse,
  GitHubOAuthCallbackRequest,
  ProviderConnectionStatusResponse,
} from '@dailyuse/contracts/sync';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Start GitHub OAuth
 */
export class StartGitHubOAuth {
  private static instance: StartGitHubOAuth;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): StartGitHubOAuth {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    StartGitHubOAuth.instance = new StartGitHubOAuth(client);
    return StartGitHubOAuth.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): StartGitHubOAuth {
    if (!StartGitHubOAuth.instance) {
      StartGitHubOAuth.instance = StartGitHubOAuth.createInstance();
    }
    return StartGitHubOAuth.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StartGitHubOAuth.instance = undefined as unknown as StartGitHubOAuth;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<GitHubOAuthStartResponse> {
    return this.apiClient.startGitHubOAuth(profileId);
  }
}

/**
 * Handle GitHub OAuth Callback
 */
export class HandleGitHubOAuthCallback {
  private static instance: HandleGitHubOAuthCallback;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): HandleGitHubOAuthCallback {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    HandleGitHubOAuthCallback.instance = new HandleGitHubOAuthCallback(client);
    return HandleGitHubOAuthCallback.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): HandleGitHubOAuthCallback {
    if (!HandleGitHubOAuthCallback.instance) {
      HandleGitHubOAuthCallback.instance = HandleGitHubOAuthCallback.createInstance();
    }
    return HandleGitHubOAuthCallback.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    HandleGitHubOAuthCallback.instance = undefined as unknown as HandleGitHubOAuthCallback;
  }

  /**
   * 执行用例
   */
  async execute(request: GitHubOAuthCallbackRequest): Promise<SyncProfile> {
    const data = await this.apiClient.handleGitHubOAuthCallback(request);
    return SyncProfile.fromClientDTO(data);
  }
}

/**
 * Check Provider Connection
 */
export class CheckProviderConnection {
  private static instance: CheckProviderConnection;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): CheckProviderConnection {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CheckProviderConnection.instance = new CheckProviderConnection(client);
    return CheckProviderConnection.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CheckProviderConnection {
    if (!CheckProviderConnection.instance) {
      CheckProviderConnection.instance = CheckProviderConnection.createInstance();
    }
    return CheckProviderConnection.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CheckProviderConnection.instance = undefined as unknown as CheckProviderConnection;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<ProviderConnectionStatusResponse> {
    return this.apiClient.checkProviderConnection(profileId);
  }
}

/**
 * Disconnect Provider
 */
export class DisconnectProvider {
  private static instance: DisconnectProvider;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): DisconnectProvider {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DisconnectProvider.instance = new DisconnectProvider(client);
    return DisconnectProvider.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DisconnectProvider {
    if (!DisconnectProvider.instance) {
      DisconnectProvider.instance = DisconnectProvider.createInstance();
    }
    return DisconnectProvider.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DisconnectProvider.instance = undefined as unknown as DisconnectProvider;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<void> {
    await this.apiClient.disconnectProvider(profileId);
  }
}
