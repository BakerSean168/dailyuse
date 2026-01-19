import { prisma } from '@/shared/infrastructure/config/prisma';
import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
  ReminderTemplateControlService,
} from '@dailyuse/domain-server/reminder';
import {
  PrismaReminderTemplateRepository,
  PrismaReminderGroupRepository,
  PrismaReminderStatisticsRepository,
} from '../repositories';
import { ReminderTemplateControlService as ControlServiceImpl } from '@dailyuse/domain-server/reminder';

/**
 * Reminder 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class ReminderContainer {
  private static instance: ReminderContainer;
  private reminderTemplateRepository?: IReminderTemplateRepository;
  private reminderGroupRepository?: IReminderGroupRepository;
  private reminderStatisticsRepository?: IReminderStatisticsRepository;
  private controlService?: ReminderTemplateControlService;

  private constructor() {}

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  /**
   * 获取提醒模板仓储实例（懒加载）
   */
  getReminderTemplateRepository(): IReminderTemplateRepository {
    if (!this.reminderTemplateRepository) {
      this.reminderTemplateRepository = new PrismaReminderTemplateRepository(prisma);
    }
    return this.reminderTemplateRepository;
  }

  /**
   * 获取提醒分组仓储实例（懒加载）
   */
  getReminderGroupRepository(): IReminderGroupRepository {
    if (!this.reminderGroupRepository) {
      this.reminderGroupRepository = new PrismaReminderGroupRepository(prisma);
    }
    return this.reminderGroupRepository;
  }

  /**
   * 获取提醒统计仓储实例（懒加载）
   */
  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    if (!this.reminderStatisticsRepository) {
      this.reminderStatisticsRepository = new PrismaReminderStatisticsRepository(prisma);
    }
    return this.reminderStatisticsRepository;
  }

  /**
   * 获取提醒模板控制服务实例（懒加载）
   */
  getControlService(): ReminderTemplateControlService {
    if (!this.controlService) {
      this.controlService = new ControlServiceImpl(
        this.getReminderTemplateRepository(),
        this.getReminderGroupRepository(),
      );
    }
    return this.controlService;
  }

  /**
   * 设置提醒模板仓储实例（用于测试）
   */
  setReminderTemplateRepository(repository: IReminderTemplateRepository): void {
    this.reminderTemplateRepository = repository;
  }

  /**
   * 设置提醒分组仓储实例（用于测试）
   */
  setReminderGroupRepository(repository: IReminderGroupRepository): void {
    this.reminderGroupRepository = repository;
  }

  /**
   * 设置提醒统计仓储实例（用于测试）
   */
  setReminderStatisticsRepository(repository: IReminderStatisticsRepository): void {
    this.reminderStatisticsRepository = repository;
  }

  /**
   * 获取 Prisma 客户端实例
   */
  getPrismaClient(): typeof prisma {
    return prisma;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.reminderTemplateRepository = undefined;
    this.reminderGroupRepository = undefined;
    this.reminderStatisticsRepository = undefined;
    this.controlService = undefined;
  }
}
