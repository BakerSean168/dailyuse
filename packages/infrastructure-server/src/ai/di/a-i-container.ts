/**
 * AI Module DI Container
 * AI 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 *
 * 鑱岃矗锟?
 * - 绠＄悊鏈嶅姟瀹炰緥鐢熷懡鍛ㄦ湡
 * - 鎻愪緵缁熶竴鐨勪緷璧栨敞鍏ユ帴锟?
 * - 鍗曚緥妯″紡
 *
 * 鏋舵瀯璇存槑锟?
 * - 棰嗗煙鏈嶅姟锟?@dailyuse/domain-server 瀵煎叆锛堢函楠岃瘉閫昏緫锟?
 * - 鍩虹璁炬柦鏈嶅姟浠庢湰锟?infrastructure/ 瀵煎叆锛圓dapter銆丵uota銆丳rompts锟?
 * - 搴旂敤鏈嶅姟鍗忚皟All鏈変緷锟?
 */

import type { PrismaClient } from '../../generated/prisma/client';
import { prisma } from '../../shared/config/prisma';
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
 * AI Container 鍗曚緥
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
    // 浣跨敤鍏ㄥ眬鍏变韩锟?Prisma 瀹炰緥锛堝凡鍦ㄥ簲鐢ㄥ惎鍔ㄦ椂杩炴帴锟?
    this.prisma = prisma;
  }

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /**
   * Get Conversation Repository
   */
  getConversationRepository(): PrismaAIConversationRepository {
    if (!this.conversationRepository) {
      this.conversationRepository = new PrismaAIConversationRepository(this.prisma);
    }
    return this.conversationRepository;
  }

  /**
   * Get Quota Repository
   */
  getQuotaRepository(): PrismaAIUsageQuotaRepository {
    if (!this.quotaRepository) {
      this.quotaRepository = new PrismaAIUsageQuotaRepository(this.prisma);
    }
    return this.quotaRepository;
  }

  /**
   * Get Task Repository
   */
  getTaskRepository(): KnowledgeGenerationTaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new KnowledgeGenerationTaskRepository(this.prisma);
    }
    return this.taskRepository;
  }

  /**
   * Get Provider Config Repository
   */
  getProviderConfigRepository(): PrismaAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      this.providerConfigRepository = new PrismaAIProviderConfigRepository(this.prisma);
    }
    return this.providerConfigRepository;
  }

  /**
   * Get AI Adapter锛堝熀纭€璁炬柦锟?
   *
   * 娉ㄦ剰锛氳繖涓柟娉曚粎鐢ㄤ簬Need瑕佸揩閫熻幏鍙栦竴锟?AI Adapter 鐨勫満锟?
   * 瀵逛簬鐢ㄦ埛鐩稿叧锟?AI 璋冪敤锛屽簲璇ヤ娇锟?getProviderConfigService().getAdapterForProvider()
   *
   * @deprecated 浣跨敤 getProviderConfigService().getAdapterForProvider() Get鎸囧畾鐢ㄦ埛 Provider 锟?Adapter
   */
  getAIAdapter(): BaseAIAdapter {
    if (!this.aiAdapter) {
      // 灏濊瘯浠庣幆澧冨彉閲忓垱寤轰竴涓复鏃堕€傞厤锟?
      // 浼樺厛浣跨敤闈掔墰浜戦厤缃紝鍥犱负瀹冧笉渚濊禆鐗瑰畾锟?OpenAI API
      try {
        this.aiAdapter = AIAdapterFactory.getQiniuAdapterFromEnv();
      } catch {
        // 濡傛灉闈掔墰浜戦厤缃笉瀛樺湪锛屽皾璇曢粯锟?OpenAI
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
   * Get Provider Config Service锛圥rovider CRUD + 閫傞厤鍣ㄧ鐞嗭級
   */
  getProviderConfigService(): AIProviderConfigService {
    if (!this.providerConfigService) {
      const repository = this.getProviderConfigRepository();
      this.providerConfigService = new AIProviderConfigService(repository);
    }
    return this.providerConfigService;
  }

  /**
   * Get Provider Switching Service锛堟櫤鑳藉垏锟?+ 鏁呴殰杞Щ锟?
   */
  getProviderSwitchingService(): AIProviderSwitchingService {
    if (!this.providerSwitchingService) {
      const repository = this.getProviderConfigRepository();
      this.providerSwitchingService = new AIProviderSwitchingService(repository);
    }
    return this.providerSwitchingService;
  }

  /**
   * Get AIGenerationValidationService锛堥鍩熸湇锟?- 绾獙璇侊級
   */
  getValidationService(): AIGenerationValidationService {
    if (!this.validationService) {
      this.validationService = new AIGenerationValidationService();
    }
    return this.validationService;
  }

  /**
   * Get AIConversationService锛堝璇濈鐞嗘湇鍔★級
   */
  getConversationService(): AIConversationService {
    if (!this.conversationService) {
      const conversationRepository = this.getConversationRepository();
      this.conversationService = new AIConversationService(conversationRepository);
    }
    return this.conversationService;
  }

  /**
   * Get GoalGenerationApplicationService锛堢洰鏍囩敓鎴愭湇鍔★級
   *
   * 娉ㄦ剰锛氭鏈嶅姟涓嶅啀缁戝畾鍥哄畾锟?AI Adapter
   * 姣忔璋冪敤鏃朵細鏍规嵁鐢ㄦ埛閰嶇疆鍔ㄦ€佽幏鍙栧搴旂殑 AI Provider
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
   * Get ApplicationService
   */
  getApplicationService(): AIGenerationApplicationService {
    if (!this.applicationService) {
      // Create渚濊禆
      const validationService = this.getValidationService();
      const aiAdapter = this.getAIAdapter();
      const quotaRepository = this.getQuotaRepository();
      const conversationRepository = this.getConversationRepository();
      const taskRepository = this.getTaskRepository();

      // Create Application Service
      this.applicationService = new AIGenerationApplicationService(
        validationService,
        aiAdapter,
        quotaRepository,
        conversationRepository,
        taskRepository,
        null, // documentService - 閬垮厤寰幆渚濊禆锛岀◢鍚庤锟?
      );
    }

    return this.applicationService;
  }

  /**
   * 娓呯悊Resource
   * 娉ㄦ剰锛氫笉鏂紑 Prisma 杩炴帴锛屽洜涓轰娇鐢ㄧ殑鏄叏灞€鍏变韩瀹炰緥
   */
  async dispose(): Promise<void> {
    // 娓呯悊鏈嶅姟瀹炰緥缂撳瓨锛屼絾涓嶆柇寮€ Prisma 杩炴帴锛堢敱搴旂敤鍏ㄥ眬绠＄悊锟?
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

