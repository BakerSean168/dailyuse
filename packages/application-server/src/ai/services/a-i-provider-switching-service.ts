/**
 * AI Provider Switching Service
 * 智能 AI 服务提供商切换服务
 *
 * 职责（DDD 应用服务层）：
 * - Provider 优先级管理
 * - 自动故障转移（Failover）
 * - 调用成本估算
 * - 健康状态监控
 */

import type { IAIProviderConfigRepository, IAIAdapter } from '@dailyuse/domain-server/ai';
import type { AIProviderConfigServerDTO, AIModelInfo } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';
// import { AIAdapterFactory } from '@dailyuse/infrastructure-server'; // Removed to break circular dependency
import type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIStreamChunk,
} from '@dailyuse/domain-server/ai'; // Updated import source

const logger = createLogger('AIProviderSwitchingService');

export type AIAdapterFactoryFn = (config: AIProviderConfigServerDTO) => IAIAdapter;

/**
 * Provider 健康状态
 */
export interface ProviderHealthStatus {
  providerUuid: string;
  isHealthy: boolean;
  lastCheckedAt: number;
  consecutiveFailures: number;
  averageLatencyMs: number;
}

/**
 * 成本估算结果
 */
export interface CostEstimation {
  providerName: string;
  modelId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
  currency: 'USD';
}

/**
 * 故障转移结果
 */
export interface FailoverResult<T> {
  success: boolean;
  usedProviderUuid: string;
  usedProviderName: string;
  attemptedProviders: string[];
  result?: T;
  error?: string;
}

/**
 * AI Provider Switching Service
 * 智能 Provider 切换与故障转移
 */
export class AIProviderSwitchingService {
  /**
   * Provider 健康状态缓存
   * Key: providerUuid, Value: 健康状态
   */
  private healthStatusCache: Map<string, ProviderHealthStatus> = new Map();

  /**
   * 健康检查间隔（5 分钟）
   */
  private static readonly HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

  /**
   * 连续失败阈值（超过此值标记为不健康）
   */
  private static readonly FAILURE_THRESHOLD = 3;

  /**
   * 不健康 Provider 冷却时间（2 分钟）
   */
  private static readonly UNHEALTHY_COOLDOWN_MS = 2 * 60 * 1000;

  constructor(
    private readonly providerRepository: IAIProviderConfigRepository,
    private readonly adapterFactory: AIAdapterFactoryFn
  ) {}

  // ===== 优先级管理 =====

  /**
   * 获取按优先级排序的活跃 Provider 列表
   */
  async getActiveProvidersByPriority(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);
    return providers
      .filter((p) => p.isActive)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  /**
   * 更新 Provider 优先级
   */
  async updateProviderPriorities(
    accountUuid: string,
    priorities: Array<{ providerUuid: string; priority: number }>,
  ): Promise<void> {
    for (const { providerUuid, priority } of priorities) {
      const provider = await this.providerRepository.findByUuid(providerUuid);
      if (provider && provider.accountUuid === accountUuid) {
        await this.providerRepository.save({
          ...provider,
          priority,
          updatedAt: Date.now(),
        });
      }
    }

    logger.info('Provider priorities updated', {
      accountUuid,
      count: priorities.length,
    });
  }

  // ===== 自动故障转移 =====

  /**
   * 带故障转移的文本生成
   * 按优先级尝试多个 Provider，直到成功或全部失败
   */
  async generateTextWithFailover<T = unknown>(
    accountUuid: string,
    request: AIGenerationRequest,
    options?: {
      maxAttempts?: number;
      specificProviderUuid?: string;
    },
  ): Promise<FailoverResult<AIGenerationResponse<T>>> {
    const attemptedProviders: string[] = [];
    const maxAttempts = options?.maxAttempts ?? 3;

    // 获取可用 Provider 列表
    let providers: AIProviderConfigServerDTO[];
    if (options?.specificProviderUuid) {
      const specific = await this.providerRepository.findByUuid(options.specificProviderUuid);
      if (!specific || specific.accountUuid !== accountUuid || !specific.isActive) {
        return {
          success: false,
          usedProviderUuid: '',
          usedProviderName: '',
          attemptedProviders: [],
          error: 'Specified provider not found or not active',
        };
      }
      providers = [specific];
    } else {
      providers = await this.getActiveProvidersByPriority(accountUuid);
    }

    // 过滤掉不健康的 Provider（除非没有其他选择）
    const healthyProviders = providers.filter((p) => this.isProviderHealthy(p.uuid));
    const providerQueue =
      healthyProviders.length > 0 ? healthyProviders : providers;

    if (providerQueue.length === 0) {
      return {
        success: false,
        usedProviderUuid: '',
        usedProviderName: '',
        attemptedProviders: [],
        error: 'No active providers available',
      };
    }

    // 按优先级尝试 Provider
    for (let i = 0; i < Math.min(maxAttempts, providerQueue.length); i++) {
      const provider = providerQueue[i];
      attemptedProviders.push(provider.name);

      try {
        const adapter = this.adapterFactory(provider);
        const startTime = Date.now();

        const result = await adapter.generateText<T>(request);

        // 更新健康状态
        this.recordSuccess(provider.uuid, Date.now() - startTime);

        logger.info('Text generation succeeded', {
          providerName: provider.name,
          model: result.model,
          attemptNumber: i + 1,
        });

        return {
          success: true,
          usedProviderUuid: provider.uuid,
          usedProviderName: provider.name,
          attemptedProviders,
          result,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Text generation failed, trying next provider', {
          providerName: provider.name,
          error: errorMessage,
          attemptNumber: i + 1,
          remainingAttempts: maxAttempts - i - 1,
        });

        // 记录失败
        this.recordFailure(provider.uuid);

        // 继续尝试下一个
        continue;
      }
    }

    return {
      success: false,
      usedProviderUuid: '',
      usedProviderName: '',
      attemptedProviders,
      error: `All ${attemptedProviders.length} providers failed`,
    };
  }

  /**
   * 带故障转移的流式生成
   * 返回第一个成功的 Provider 的流
   */
  async streamTextWithFailover(
    accountUuid: string,
    request: AIGenerationRequest,
    options?: {
      maxAttempts?: number;
      specificProviderUuid?: string;
    },
  ): Promise<
    FailoverResult<{
      stream: AsyncGenerator<AIStreamChunk, void, unknown>;
      adapter: BaseAIAdapter;
    }>
  > {
    const attemptedProviders: string[] = [];
    const maxAttempts = options?.maxAttempts ?? 3;

    // 获取可用 Provider 列表
    let providers: AIProviderConfigServerDTO[];
    if (options?.specificProviderUuid) {
      const specific = await this.providerRepository.findByUuid(options.specificProviderUuid);
      if (!specific || specific.accountUuid !== accountUuid || !specific.isActive) {
        return {
          success: false,
          usedProviderUuid: '',
          usedProviderName: '',
          attemptedProviders: [],
          error: 'Specified provider not found or not active',
        };
      }
      providers = [specific];
    } else {
      providers = await this.getActiveProvidersByPriority(accountUuid);
    }

    // 过滤掉不健康的 Provider
    const healthyProviders = providers.filter((p) => this.isProviderHealthy(p.uuid));
    const providerQueue =
      healthyProviders.length > 0 ? healthyProviders : providers;

    if (providerQueue.length === 0) {
      return {
        success: false,
        usedProviderUuid: '',
        usedProviderName: '',
        attemptedProviders: [],
        error: 'No active providers available',
      };
    }

    // 按优先级尝试 Provider
    for (let i = 0; i < Math.min(maxAttempts, providerQueue.length); i++) {
      const provider = providerQueue[i];
      attemptedProviders.push(provider.name);

      try {
        const adapter = this.adapterFactory(provider);

        // 流式生成不能预先测试，返回流让调用方处理
        const stream = adapter.streamText(request);

        // 记录尝试（成功/失败由调用方在流完成后报告）
        logger.info('Stream generation initiated', {
          providerName: provider.name,
          attemptNumber: i + 1,
        });

        return {
          success: true,
          usedProviderUuid: provider.uuid,
          usedProviderName: provider.name,
          attemptedProviders,
          result: { stream, adapter },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Stream generation setup failed, trying next provider', {
          providerName: provider.name,
          error: errorMessage,
          attemptNumber: i + 1,
        });

        this.recordFailure(provider.uuid);
        continue;
      }
    }

    return {
      success: false,
      usedProviderUuid: '',
      usedProviderName: '',
      attemptedProviders,
      error: `All ${attemptedProviders.length} providers failed to initialize stream`,
    };
  }

  // ===== 成本估算 =====

  /**
   * 估算单次调用成本
   * 基于模型定价和预估 token 数量
   */
  estimateCost(
    provider: AIProviderConfigServerDTO,
    modelId: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
  ): CostEstimation {
    const model = provider.availableModels.find((m) => m.id === modelId);

    // 获取模型成本（单位：美元/百万 token）
    const inputCostPer1M = model?.inputCostPer1M ?? this.getDefaultInputCost(modelId);
    const outputCostPer1M = model?.outputCostPer1M ?? this.getDefaultOutputCost(modelId);

    // 计算成本
    const inputCost = (estimatedInputTokens / 1_000_000) * inputCostPer1M;
    const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostPer1M;
    const totalCost = inputCost + outputCost;

    return {
      providerName: provider.name,
      modelId,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUSD: Math.round(totalCost * 1_000_000) / 1_000_000, // 6 位小数
      currency: 'USD',
    };
  }

  /**
   * 比较多个 Provider 的成本
   */
  async compareCosts(
    accountUuid: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
  ): Promise<CostEstimation[]> {
    const providers = await this.getActiveProvidersByPriority(accountUuid);

    const estimations: CostEstimation[] = [];
    for (const provider of providers) {
      const modelId = provider.defaultModel ?? provider.availableModels[0]?.id ?? 'default';
      estimations.push(
        this.estimateCost(provider, modelId, estimatedInputTokens, estimatedOutputTokens),
      );
    }

    // 按成本排序
    return estimations.sort((a, b) => a.estimatedCostUSD - b.estimatedCostUSD);
  }

  /**
   * 获取默认输入成本（美元/百万 token）
   */
  private getDefaultInputCost(modelId: string): number {
    const modelLower = modelId.toLowerCase();

    // GPT-4 系列
    if (modelLower.includes('gpt-4-turbo') || modelLower.includes('gpt-4o')) {
      return 10.0;
    }
    if (modelLower.includes('gpt-4')) {
      return 30.0;
    }

    // GPT-3.5 系列
    if (modelLower.includes('gpt-3.5')) {
      return 0.5;
    }

    // Claude 系列
    if (modelLower.includes('claude-3-opus')) {
      return 15.0;
    }
    if (modelLower.includes('claude-3-sonnet')) {
      return 3.0;
    }
    if (modelLower.includes('claude-3-haiku')) {
      return 0.25;
    }

    // DeepSeek 系列
    if (modelLower.includes('deepseek-v3')) {
      return 0.27;
    }
    if (modelLower.includes('deepseek')) {
      return 0.14;
    }

    // Qwen 系列
    if (modelLower.includes('qwen-plus')) {
      return 0.8;
    }
    if (modelLower.includes('qwen-turbo')) {
      return 0.3;
    }

    // Groq 系列（通常更便宜）
    if (modelLower.includes('llama') || modelLower.includes('mixtral')) {
      return 0.27;
    }

    // 默认
    return 2.0;
  }

  /**
   * 获取默认输出成本（美元/百万 token）
   */
  private getDefaultOutputCost(modelId: string): number {
    const modelLower = modelId.toLowerCase();

    // GPT-4 系列
    if (modelLower.includes('gpt-4-turbo') || modelLower.includes('gpt-4o')) {
      return 30.0;
    }
    if (modelLower.includes('gpt-4')) {
      return 60.0;
    }

    // GPT-3.5 系列
    if (modelLower.includes('gpt-3.5')) {
      return 1.5;
    }

    // Claude 系列
    if (modelLower.includes('claude-3-opus')) {
      return 75.0;
    }
    if (modelLower.includes('claude-3-sonnet')) {
      return 15.0;
    }
    if (modelLower.includes('claude-3-haiku')) {
      return 1.25;
    }

    // DeepSeek 系列
    if (modelLower.includes('deepseek-v3')) {
      return 1.1;
    }
    if (modelLower.includes('deepseek')) {
      return 0.28;
    }

    // Qwen 系列
    if (modelLower.includes('qwen-plus')) {
      return 2.0;
    }
    if (modelLower.includes('qwen-turbo')) {
      return 0.6;
    }

    // Groq 系列
    if (modelLower.includes('llama') || modelLower.includes('mixtral')) {
      return 0.27;
    }

    // 默认
    return 6.0;
  }

  // ===== 健康状态管理 =====

  /**
   * 检查 Provider 是否健康
   */
  isProviderHealthy(providerUuid: string): boolean {
    const status = this.healthStatusCache.get(providerUuid);
    if (!status) {
      return true; // 未知状态视为健康
    }

    // 如果不健康但已过冷却期，允许重试
    if (!status.isHealthy) {
      const elapsed = Date.now() - status.lastCheckedAt;
      if (elapsed >= AIProviderSwitchingService.UNHEALTHY_COOLDOWN_MS) {
        return true;
      }
    }

    return status.isHealthy;
  }

  /**
   * 获取所有 Provider 的健康状态
   */
  async getHealthStatuses(accountUuid: string): Promise<ProviderHealthStatus[]> {
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);
    return providers.map((p) => {
      const cached = this.healthStatusCache.get(p.uuid);
      return (
        cached ?? {
          providerUuid: p.uuid,
          isHealthy: true,
          lastCheckedAt: 0,
          consecutiveFailures: 0,
          averageLatencyMs: 0,
        }
      );
    });
  }

  /**
   * 执行 Provider 健康检查
   */
  async checkProviderHealth(providerUuid: string): Promise<ProviderHealthStatus> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const startTime = Date.now();

    try {
      const adapter = this.adapterFactory(provider);
      const isHealthy = await adapter.healthCheck();

      const status: ProviderHealthStatus = {
        providerUuid,
        isHealthy,
        lastCheckedAt: Date.now(),
        consecutiveFailures: isHealthy ? 0 : 1,
        averageLatencyMs: Date.now() - startTime,
      };

      this.healthStatusCache.set(providerUuid, status);
      return status;
    } catch (error) {
      const status: ProviderHealthStatus = {
        providerUuid,
        isHealthy: false,
        lastCheckedAt: Date.now(),
        consecutiveFailures:
          (this.healthStatusCache.get(providerUuid)?.consecutiveFailures ?? 0) + 1,
        averageLatencyMs: Date.now() - startTime,
      };

      this.healthStatusCache.set(providerUuid, status);
      return status;
    }
  }

  /**
   * 记录成功调用
   */
  private recordSuccess(providerUuid: string, latencyMs: number): void {
    const existing = this.healthStatusCache.get(providerUuid);
    const avgLatency = existing
      ? (existing.averageLatencyMs * 0.8 + latencyMs * 0.2) // 移动平均
      : latencyMs;

    this.healthStatusCache.set(providerUuid, {
      providerUuid,
      isHealthy: true,
      lastCheckedAt: Date.now(),
      consecutiveFailures: 0,
      averageLatencyMs: avgLatency,
    });
  }

  /**
   * 记录失败调用
   */
  private recordFailure(providerUuid: string): void {
    const existing = this.healthStatusCache.get(providerUuid);
    const failures = (existing?.consecutiveFailures ?? 0) + 1;

    this.healthStatusCache.set(providerUuid, {
      providerUuid,
      isHealthy: failures < AIProviderSwitchingService.FAILURE_THRESHOLD,
      lastCheckedAt: Date.now(),
      consecutiveFailures: failures,
      averageLatencyMs: existing?.averageLatencyMs ?? 0,
    });

    if (failures >= AIProviderSwitchingService.FAILURE_THRESHOLD) {
      logger.warn('Provider marked as unhealthy', {
        providerUuid,
        consecutiveFailures: failures,
      });
    }
  }

  /**
   * 重置健康状态缓存
   */
  clearHealthCache(): void {
    this.healthStatusCache.clear();
    logger.info('Health status cache cleared');
  }
}
