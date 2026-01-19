/**
 * AI Module DI Container
 * AI 模块依赖注入容器
 *
 * 职责：
 * - 管理服务实例生命周期
 * - 提供统一的依赖注入接口
 * - 单例模式
 *
 * 架构说明：
 * - 领域服务从 @dailyuse/domain-server 导入（纯验证逻辑）
 * - 基础设施服务从本地 infrastructure/ 导入（Adapter、Quota、Prompts）
 * - 应用服务协调所有依赖
 */

import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/shared/infrastructure/config/prisma';
import { AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import {
  AIGenerationApplicationService,
  AIConversationService,
  AIProviderConfigService,
  AIProviderSwitchingService,
  GoalGenerationApplicationService,
} from '@dailyuse/application-server';
import { PrismaAIUsageQuotaRepository } from '../repositories/PrismaAIUsageQuotaRepository';
import { PrismaAIConversationRepository } from '../repositories/PrismaAIConversationRepository';
import { PrismaAIProviderConfigRepository } from '../repositories/PrismaAIProviderConfigRepository';
import { KnowledgeGenerationTaskRepository } from '../repositories/KnowledgeGenerationTaskRepository';
import { AIAdapterFactory } from '../adapters/AIAdapterFactory';
import type { BaseAIAdapter } from '../adapters/BaseAIAdapter';

/**
 * AI Container 单例
 */
export class AIContainer {
  private static instance: AIContainer;
  private prisma: PrismaClient;
  private applicationService?: AIGenerationApplicationService;
  private conversationService?: AIConversationService;
  private providerConfigService?: AIProviderConfigService;
  private providerSwitchingService?: AIProviderSwitchingService;
  private goalGenerationService?: GoalGenerationApplicationService;
  private validationService?: AIGenerationValidationService;
  private conversationRepository?: PrismaAIConversationRepository;
  private quotaRepository?: PrismaAIUsageQuotaRepository;
  private providerConfigRepository?: PrismaAIProviderConfigRepository;
  private taskRepository?: KnowledgeGenerationTaskRepository;
  private aiAdapter?: BaseAIAdapter;

  private constructor() {
    // 使用全局共享的 Prisma 实例（已在应用启动时连接）
    this.prisma = prisma;
  }

  /**
   * 获取容器单例
   */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /**
   * 获取 Conversation Repository
   */
  getConversationRepository(): PrismaAIConversationRepository {
    if (!this.conversationRepository) {
      this.conversationRepository = new PrismaAIConversationRepository(this.prisma);
    }
    return this.conversationRepository;
  }

  /**
   * 获取 Quota Repository
   */
  getQuotaRepository(): PrismaAIUsageQuotaRepository {
    if (!this.quotaRepository) {
      this.quotaRepository = new PrismaAIUsageQuotaRepository(this.prisma);
    }
    return this.quotaRepository;
  }

  /**
   * 获取 Task Repository
   */
  getTaskRepository(): KnowledgeGenerationTaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new KnowledgeGenerationTaskRepository(this.prisma);
    }
    return this.taskRepository;
  }

  /**
   * 获取 Provider Config Repository
   */
  getProviderConfigRepository(): PrismaAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      this.providerConfigRepository = new PrismaAIProviderConfigRepository(this.prisma);
    }
    return this.providerConfigRepository;
  }

  /**
   * 获取 AI Adapter（基础设施）
   *
   * 注意：这个方法仅用于需要快速获取一个 AI Adapter 的场景
   * 对于用户相关的 AI 调用，应该使用 getProviderConfigService().getAdapterForProvider()
   *
   * @deprecated 使用 getProviderConfigService().getAdapterForProvider() 获取指定用户 Provider 的 Adapter
   */
  getAIAdapter(): BaseAIAdapter {
    if (!this.aiAdapter) {
      // 尝试从环境变量创建一个临时适配器
      // 优先使用青牛云配置，因为它不依赖特定的 OpenAI API
      try {
        this.aiAdapter = AIAdapterFactory.getQiniuAdapterFromEnv();
      } catch {
        // 如果青牛云配置不存在，尝试默认 OpenAI
        try {
          this.aiAdapter = AIAdapterFactory.getDefaultAdapter();
        } catch {
          throw new Error(
            'No AI Provider configured in environment. ' +
              'Please set QI_NIU_YUN_API_KEY + QI_NIU_YUN_BASE_URL or OPENAI_API_KEY.',
          );
        }
      }
    }
    return this.aiAdapter;
  }

  /**
   * 获取 Provider Config Service（Provider CRUD + 适配器管理）
   */
  getProviderConfigService(): AIProviderConfigService {
    if (!this.providerConfigService) {
      const repository = this.getProviderConfigRepository();
      this.providerConfigService = new AIProviderConfigService(repository);
    }
    return this.providerConfigService;
  }

  /**
   * 获取 Provider Switching Service（智能切换 + 故障转移）
   */
  getProviderSwitchingService(): AIProviderSwitchingService {
    if (!this.providerSwitchingService) {
      const repository = this.getProviderConfigRepository();
      this.providerSwitchingService = new AIProviderSwitchingService(repository);
    }
    return this.providerSwitchingService;
  }

  /**
   * 获取 AIGenerationValidationService（领域服务 - 纯验证）
   */
  getValidationService(): AIGenerationValidationService {
    if (!this.validationService) {
      this.validationService = new AIGenerationValidationService();
    }
    return this.validationService;
  }

  /**
   * 获取 AIConversationService（对话管理服务）
   */
  getConversationService(): AIConversationService {
    if (!this.conversationService) {
      const conversationRepository = this.getConversationRepository();
      this.conversationService = new AIConversationService(conversationRepository);
    }
    return this.conversationService;
  }

  /**
   * 获取 GoalGenerationApplicationService（目标生成服务）
   *
   * 注意：此服务不再绑定固定的 AI Adapter
   * 每次调用时会根据用户配置动态获取对应的 AI Provider
   */
  getGoalGenerationService(): GoalGenerationApplicationService {
    if (!this.goalGenerationService) {
      const validationService = this.getValidationService();
      const providerConfigRepository = this.getProviderConfigRepository();
      const quotaRepository = this.getQuotaRepository();

      this.goalGenerationService = new GoalGenerationApplicationService(
        validationService,
        providerConfigRepository,
        quotaRepository,
      );
    }
    return this.goalGenerationService;
  }

  /**
   * 获取 ApplicationService
   */
  getApplicationService(): AIGenerationApplicationService {
    if (!this.applicationService) {
      // 创建依赖
      const validationService = this.getValidationService();
      const aiAdapter = this.getAIAdapter();
      const quotaRepository = this.getQuotaRepository();
      const conversationRepository = this.getConversationRepository();
      const taskRepository = this.getTaskRepository();

      // 创建 Application Service
      this.applicationService = new AIGenerationApplicationService(
        validationService,
        aiAdapter,
        quotaRepository,
        conversationRepository,
        taskRepository,
        null, // documentService - 避免循环依赖，稍后设置
      );
    }

    return this.applicationService;
  }

  /**
   * 清理资源
   * 注意：不断开 Prisma 连接，因为使用的是全局共享实例
   */
  async dispose(): Promise<void> {
    // 清理服务实例缓存，但不断开 Prisma 连接（由应用全局管理）
    this.applicationService = undefined;
    this.conversationService = undefined;
    this.providerConfigService = undefined;
    this.providerSwitchingService = undefined;
    this.goalGenerationService = undefined;
    this.validationService = undefined;
    this.conversationRepository = undefined;
    this.quotaRepository = undefined;
    this.providerConfigRepository = undefined;
    this.taskRepository = undefined;
    this.aiAdapter = undefined;
  }
}
