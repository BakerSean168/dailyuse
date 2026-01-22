/**
 * Goal Generation Application Service
 *
 * 目标生成应用服务 - 从用户想法生成 OKR 目标和关键结果
 * 依赖注入模式：所有依赖通过构造函数注入，不直接依赖具体实现
 */

import type {
  IAIUsageQuotaRepository,
  IAIProviderConfigRepository,
  AIGenerationValidationService,
  IQuotaEnforcementService,
} from '@dailyuse/domain-server/ai';
import type {
  AIUsageQuotaServerDTO,
  GeneratedGoalDraft,
  GenerateGoalResponse,
  GenerateGoalWithKRsResponse,
  GenerateKeyResultsResponse,
  KeyResultPreview,
  GoalCategory,
} from '@dailyuse/contracts/ai';
import { GenerationTaskType } from '@dailyuse/contracts/ai';
import { randomUUID } from 'crypto';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalGenerationApplicationService');

/**
 * 生成目标请求参数
 */
export interface GenerateGoalParams {
  /** 用户账户 UUID */
  accountUuid: string;
  /** 用户输入的想法/描述 */
  idea: string;
  /** 额外上下文信息 */
  context?: string;
  /** 指定的 AI Provider UUID */
  providerUuid?: string;
  /** 目标类别 */
  category?: GoalCategory;
  /** 时间范围描述（如 'week', 'month', 'quarter', 'unlimited'） */
  timeRange?: string;
  /** 开始日期时间戳 */
  startDate?: number;
  /** 结束日期时间戳（undefined 表示无期限） */
  endDate?: number;
  /** 是否包含关键结果 */
  includeKeyResults?: boolean;
  /** 关键结果数量（undefined 表示由 AI 决定） */
  keyResultCount?: number;
  /** 时间范围（旧版兼容） */
  timeframe?: {
    startDate?: number;
    endDate?: number;
  };
}

/**
 * 生成关键结果请求参数
 */
export interface GenerateKeyResultsParams {
  /** 用户账户 UUID */
  accountUuid: string;
  /** 目标标题 */
  goalTitle: string;
  /** 目标描述 */
  goalDescription?: string;
  /** 开始日期时间戳 */
  startDate: number;
  /** 结束日期时间戳 */
  endDate: number;
  /** 目标上下文 */
  goalContext?: string;
  /** 指定的 AI Provider UUID（可选，不指定则使用用户默认配置） */
  providerUuid?: string;
}

/**
 * Goal Generation Application Service
 */
export class GoalGenerationApplicationService {
  constructor(
    private readonly validationService: AIGenerationValidationService,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly quotaRepository: IAIUsageQuotaRepository,
    private readonly quotaEnforcementService: IQuotaEnforcementService,
    private readonly adapterFactory: any, // AIAdapterFactory from domain layer
  ) {}
      );
    }
    return GoalGenerationApplicationService.instance;
  }

  /**
   * 设置服务单例
   */
  static setInstance(instance: GoalGenerationApplicationService): void {
    GoalGenerationApplicationService.instance = instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GoalGenerationApplicationService.instance = undefined;
  }

  /**
   * 获取用户配置的 AI Adapter
   *
   * 优先级：
   * 1. 如果指定了 providerUuid，使用该配置
   * 2. 否则使用用户的默认 Provider 配置
   * 3. 如果用户没有配置任何 Provider，抛出错误提示用户配置
   */
  private async getAIAdapter(
    accountUuid: string,
    providerUuid?: string,
  ): Promise<{
    adapter: BaseAIAdapter;
    providerName: string;
    modelId: string;
  }> {
    let providerConfig;

    if (providerUuid) {
      // 使用指定的 Provider
      providerConfig = await this.providerConfigRepository.findByUuid(providerUuid);
      if (!providerConfig) {
        throw new Error(`AI Provider not found: ${providerUuid}`);
      }
      if (providerConfig.accountUuid !== accountUuid) {
        throw new Error('AI Provider does not belong to this account');
      }
    } else {
      // 使用用户的默认 Provider
      providerConfig = await this.providerConfigRepository.findDefaultByAccountUuid(accountUuid);
      if (!providerConfig) {
        throw new Error(
          'No AI Provider configured. Please configure an AI Provider in Settings first.',
        );
      }
    }

    if (!providerConfig.isActive) {
      throw new Error('AI Provider is not active. Please activate it in Settings.');
    }

    // 使用工厂创建对应的 Adapter
    const adapter = AIAdapterFactory.createFromConfig(providerConfig);

    return {
      adapter,
      providerName: providerConfig.name,
      modelId: providerConfig.defaultModel || 'unknown',
    };
  }

  /**
   * 从用户想法生成 OKR 目标
   *
   * 业务流程：
   * 1. 验证输入参数
   * 2. 获取并检查用户配额
   * 3. 获取用户配置的 AI Adapter
   * 4. 构建 GENERATE_GOAL_PROMPT
   * 5. 调用 AI Adapter 生成
   * 6. 解析并验证输出
   * 7. 消费配额
   * 8. 返回 GenerateGoalResponse 或 GenerateGoalWithKRsResponse
   */
  async generateGoal(
    params: GenerateGoalParams,
  ): Promise<GenerateGoalResponse | GenerateGoalWithKRsResponse> {
    const {
      accountUuid,
      idea,
      context,
      providerUuid,
      category,
      timeRange,
      startDate,
      endDate,
      includeKeyResults,
      keyResultCount,
      timeframe,
    } = params;

    // 1. 验证输入
    this.validateIdeaInput(idea);

    // 2. 获取配额
    const quota = await this.getOrCreateQuota(accountUuid);
    this.quotaEnforcementService.checkQuota(quota, 1);

    // 3. 获取用户配置的 AI Adapter
    const { adapter, providerName, modelId } = await this.getAIAdapter(accountUuid, providerUuid);

    // 4. 构建 Prompt
    // 合并新旧的时间范围参数
    const resolvedTimeframe = timeframe || {
      startDate,
      endDate,
    };

    const promptContext = {
      idea: idea.trim(),
      category,
      timeRange, // 时间范围描述
      timeframe: resolvedTimeframe,
      includeKeyResults,
      keyResultCount,
      additionalContext: context?.trim(),
    };

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GOAL_GENERATION,
      prompt: GENERATE_GOAL_PROMPT.user(promptContext),
      systemPrompt: GENERATE_GOAL_PROMPT.system,
      temperature: 0.7,
      maxTokens: 2000,
      contextData: promptContext,
    };

    logger.info('Generating goal from idea', {
      accountUuid,
      ideaLength: idea.length,
      hasContext: !!context,
      providerName,
      modelId,
    });

    // 5. 调用 AI Adapter 生成
    const response = await adapter.generateText<GeneratedGoalDraft>(request);

    // 6. 解析输出
    let goalDraft: GeneratedGoalDraft;
    try {
      if (response.parsedContent) {
        goalDraft = response.parsedContent;
      } else {
        goalDraft = JSON.parse(response.content);
      }
    } catch (error) {
      logger.error('Failed to parse goal generation response', {
        error,
        content: response.content.substring(0, 500),
      });
      throw new Error('AI response JSON parse failed');
    }

    // 7. 验证输出
    this.validateGoalDraft(goalDraft);

    // 8. 消费配额
    const updatedQuota = this.quotaEnforcementService.consumeQuota(quota, 1);
    await this.quotaRepository.save(updatedQuota as any);

    // 提取 keyResults（如果存在）
    const keyResults = (goalDraft as any).keyResults as KeyResultPreview[] | undefined;

    // 从 goalDraft 中移除 keyResults 字段（它属于响应的顶层）
    const goalWithoutKRs = { ...goalDraft };
    delete (goalWithoutKRs as any).keyResults;

    logger.info('Goal generated successfully', {
      accountUuid,
      goalTitle: goalDraft.title,
      tokensUsed: response.tokenUsage.totalTokens,
      providerName,
      keyResultsCount: keyResults?.length || 0,
    });

    // 9. 返回结果
    const baseResponse = {
      goal: goalWithoutKRs,
      tokenUsage: {
        promptTokens: response.tokenUsage.promptTokens,
        completionTokens: response.tokenUsage.completionTokens,
        totalTokens: response.tokenUsage.totalTokens,
      },
      generatedAt: response.generatedAt.getTime(),
      providerUsed: providerName,
      modelUsed: modelId,
    };

    // 如果包含关键结果，返回 GenerateGoalWithKRsResponse
    if (includeKeyResults && keyResults && keyResults.length > 0) {
      return {
        ...baseResponse,
        keyResults,
      } as GenerateGoalWithKRsResponse;
    }

    return baseResponse as GenerateGoalResponse;
  }

  /**
   * 生成关键结果（Key Results）
   *
   * 业务流程：
   * 1. 验证输入参数
   * 2. 获取并检查用户配额
   * 3. 获取用户配置的 AI Adapter
   * 4. 获取 Prompt 模板
   * 5. 调用 AI Adapter 生成
   * 6. 解析并验证输出
   * 7. 消费配额
   * 8. 返回 GenerateKeyResultsResponse
   */
  async generateKeyResults(params: GenerateKeyResultsParams): Promise<GenerateKeyResultsResponse> {
    const {
      accountUuid,
      goalTitle,
      goalDescription,
      startDate,
      endDate,
      goalContext,
      providerUuid,
    } = params;

    // 1. 验证输入
    this.validateGoalTitleInput(goalTitle);

    // 2. 获取配额
    const quota = await this.getOrCreateQuota(accountUuid);
    this.quotaEnforcementService.checkQuota(quota, 1);

    // 3. 获取用户配置的 AI Adapter
    const { adapter, providerName, modelId } = await this.getAIAdapter(accountUuid, providerUuid);

    // 4. 获取 Prompt 模板
    const template = getPromptTemplate(GenerationTaskType.GOAL_KEY_RESULTS);

    // 5. 构建 AI 请求上下文
    const context = {
      goalTitle,
      goalDescription,
      startDate,
      endDate,
      goalContext,
    };

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GOAL_KEY_RESULTS,
      prompt: template.user(context),
      systemPrompt: template.system,
      temperature: 0.7,
      maxTokens: 2000,
      contextData: context,
    };

    logger.info('Generating key results', {
      accountUuid,
      goalTitle,
      providerName,
      modelId,
    });

    // 6. 调用 AI Adapter 生成
    const response = await adapter.generateText<KeyResultPreview[]>(request);

    // 7. 解析输出
    let keyResults: KeyResultPreview[];
    try {
      keyResults = response.parsedContent || JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse key results response', {
        error,
        content: response.content.substring(0, 500),
      });
      throw new Error('AI response JSON parse failed');
    }

    // 8. 验证输出
    this.validationService.validateKeyResultsOutput(keyResults);

    // 9. 消费配额
    const updatedQuota = this.quotaEnforcementService.consumeQuota(quota, 1);
    await this.quotaRepository.save(updatedQuota as any);

    logger.info('Key results generated successfully', {
      accountUuid,
      keyResultCount: keyResults.length,
      tokensUsed: response.tokenUsage.totalTokens,
      providerName,
    });

    // 10. 返回结果
    return {
      keyResults,
      tokenUsage: {
        promptTokens: response.tokenUsage.promptTokens,
        completionTokens: response.tokenUsage.completionTokens,
        totalTokens: response.tokenUsage.totalTokens,
      },
      generatedAt: response.generatedAt.getTime(),
    };
  }

  /**
   * 获取或创建用户配额
   */
  private async getOrCreateQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO> {
    let quota = await this.quotaRepository.findByAccountUuid(accountUuid);
    if (!quota) {
      quota = {
        uuid: randomUUID(),
        accountUuid,
        quotaLimit: 100,
        currentUsage: 0,
        resetPeriod: 'MONTHLY' as any,
        lastResetAt: Date.now(),
        nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.quotaRepository.save(quota as any);
    }
    return quota as AIUsageQuotaServerDTO;
  }

  /**
   * 验证用户输入的想法
   */
  private validateIdeaInput(idea: string): void {
    if (!idea || typeof idea !== 'string') {
      throw new Error('Idea is required');
    }

    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < 5) {
      throw new Error('Idea must be at least 5 characters');
    }

    if (trimmedIdea.length > 2000) {
      throw new Error('Idea must be less than 2000 characters');
    }
  }

  /**
   * 验证目标标题输入
   */
  private validateGoalTitleInput(goalTitle: string): void {
    if (!goalTitle || typeof goalTitle !== 'string') {
      throw new Error('Goal title is required');
    }

    const trimmedTitle = goalTitle.trim();
    if (trimmedTitle.length < 2) {
      throw new Error('Goal title must be at least 2 characters');
    }

    if (trimmedTitle.length > 200) {
      throw new Error('Goal title must be less than 200 characters');
    }
  }

  /**
   * 验证生成的目标草稿
   */
  private validateGoalDraft(draft: GeneratedGoalDraft): void {
    if (!draft.title || typeof draft.title !== 'string' || draft.title.length < 2) {
      throw new Error('Generated goal must have a valid title');
    }
    if (
      !draft.description ||
      typeof draft.description !== 'string' ||
      draft.description.length < 10
    ) {
      throw new Error('Generated goal must have a valid description');
    }
    if (!draft.category || typeof draft.category !== 'string') {
      throw new Error('Generated goal must have a category');
    }
    // 验证 importance 是合法的枚举值
    const validImportance = ['vital', 'important', 'moderate', 'minor', 'trivial'];
    if (
      !draft.importance ||
      typeof draft.importance !== 'string' ||
      !validImportance.includes(draft.importance)
    ) {
      throw new Error(
        `Generated goal must have valid importance (one of: ${validImportance.join(', ')})`,
      );
    }
    if (!Array.isArray(draft.tags)) {
      throw new Error('Generated goal must have tags array');
    }
  }
}

/**
 * 便捷函数：生成目标
 */
export const generateGoal = (
  params: GenerateGoalParams,
): ReturnType<GoalGenerationApplicationService['generateGoal']> =>
  GoalGenerationApplicationService.getInstance().generateGoal(params);

/**
 * 便捷函数：生成目标和关键结果
 */
export const generateGoalWithKRs = (
  params: GenerateGoalParams,
): ReturnType<GoalGenerationApplicationService['generateGoalWithKRs']> =>
  GoalGenerationApplicationService.getInstance().generateGoalWithKRs(params);

/**
 * 便捷函数：生成关键结果
 */
export const generateKeyResults = (
  params: GenerateKeyResultsParams,
): ReturnType<GoalGenerationApplicationService['generateKeyResults']> =>
  GoalGenerationApplicationService.getInstance().generateKeyResults(params);
