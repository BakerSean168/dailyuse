/**
 * DataMigrationService - 数据迁移服务
 *
 * 负责在账户之间迁移数据：
 * - 本地账户 → 云端账户（注册/登录时）
 * - 云端账户 → 本地账户（注销时可选）
 * - 账户合并（冲突解决）
 *
 * 核心功能：
 * - 数据备份和恢复
 * - 账户关联迁移
 * - 迁移进度追踪
 * - 回滚支持
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { SyncDataBundle } from '@dailyuse/contracts/sync';
import { DataCollector } from './DataCollector';

/**
 * 迁移类型
 */
export type MigrationType = 'local-to-cloud' | 'cloud-to-local' | 'merge';

/**
 * 迁移状态
 */
export type MigrationStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy = 'keep-local' | 'keep-cloud' | 'merge' | 'manual';

/**
 * 迁移进度
 */
export interface MigrationProgress {
  status: MigrationStatus;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  message: string;
  startTime?: number;
  endTime?: number;
  error?: string;
}

/**
 * 迁移结果
 */
export interface MigrationResult {
  success: boolean;
  migrationType: MigrationType;
  migratedEntities: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
  };
  conflicts: MigrationConflict[];
  backupPath?: string;
  error?: string;
  duration: number;
}

/**
 * 迁移冲突
 */
export interface MigrationConflict {
  entityType: 'goal' | 'task' | 'schedule' | 'reminder';
  entityUuid: string;
  localVersion: unknown;
  cloudVersion: unknown;
  resolution?: 'local' | 'cloud' | 'merged';
  resolvedData?: unknown;
}

/**
 * 迁移配置
 */
export interface MigrationConfig {
  /** 冲突解决策略 */
  conflictStrategy?: ConflictResolutionStrategy;
  /** 是否创建备份 */
  createBackup?: boolean;
  /** 备份目录 */
  backupDir?: string;
  /** 源账户 UUID */
  sourceAccountUuid: string;
  /** 目标账户 UUID */
  targetAccountUuid: string;
}

/**
 * 数据迁移服务
 */
export class DataMigrationService {
  private static instance: DataMigrationService | null = null;

  private readonly logger: ILogger;
  private readonly backupBaseDir: string;

  // 数据收集器
  private dataCollector: DataCollector;

  // 迁移状态
  private currentMigration: MigrationProgress | null = null;
  private migrationHistory: MigrationResult[] = [];

  // 进度回调
  private progressCallbacks: Set<(progress: MigrationProgress) => void> = new Set();

  private constructor(logger?: ILogger) {
    this.logger = logger || createLogger('DataMigrationService');
    this.backupBaseDir = path.join(app.getPath('userData'), 'backups');
    this.dataCollector = DataCollector.getInstance();

    // 确保备份目录存在
    this.ensureBackupDir();
  }

  /**
   * 获取单例实例
   */
  static getInstance(logger?: ILogger): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService(logger);
    }
    return DataMigrationService.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    DataMigrationService.instance = null;
  }

  // ============ 迁移操作 ============

  /**
   * 从本地账户迁移到云端账户
   *
   * 场景：用户注册/登录云端账户，需要将本地数据关联到云端账户
   */
  async migrateLocalToCloud(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    this.logger.info('Starting local-to-cloud migration', {
      source: config.sourceAccountUuid,
      target: config.targetAccountUuid,
    });

    this.initProgress('local-to-cloud');

    try {
      // Step 1: 创建备份
      let backupPath: string | undefined;
      if (config.createBackup !== false) {
        this.updateProgress('backup', 'Creating backup...');
        backupPath = await this.createBackup(config.sourceAccountUuid);
      }

      // Step 2: 收集本地数据
      this.updateProgress('collect', 'Collecting local data...');
      const localData = await this.dataCollector.collectAllData();

      // Step 3: 更新账户关联
      this.updateProgress('migrate', 'Migrating data to cloud account...');
      const migratedCounts = await this.updateAccountAssociations(
        localData,
        config.sourceAccountUuid,
        config.targetAccountUuid
      );

      // Step 4: 完成
      this.updateProgress('complete', 'Migration completed');

      const result: MigrationResult = {
        success: true,
        migrationType: 'local-to-cloud',
        migratedEntities: migratedCounts,
        conflicts: [],
        backupPath,
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    } catch (error) {
      this.logger.error('Migration failed', { error });

      const result: MigrationResult = {
        success: false,
        migrationType: 'local-to-cloud',
        migratedEntities: { goals: 0, tasks: 0, schedules: 0, reminders: 0 },
        conflicts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    }
  }

  /**
   * 从云端账户迁移到本地账户
   *
   * 场景：用户注销云端账户，选择保留数据到本地
   */
  async migrateCloudToLocal(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    this.logger.info('Starting cloud-to-local migration', {
      source: config.sourceAccountUuid,
      target: config.targetAccountUuid,
    });

    this.initProgress('cloud-to-local');

    try {
      // Step 1: 创建备份
      let backupPath: string | undefined;
      if (config.createBackup !== false) {
        this.updateProgress('backup', 'Creating backup...');
        backupPath = await this.createBackup(config.targetAccountUuid);
      }

      // Step 2: 收集云端数据
      this.updateProgress('collect', 'Collecting cloud data...');
      const cloudData = await this.dataCollector.collectAllData();

      // Step 3: 更新账户关联
      this.updateProgress('migrate', 'Migrating data to local account...');
      const migratedCounts = await this.updateAccountAssociations(
        cloudData,
        config.sourceAccountUuid,
        config.targetAccountUuid
      );

      // Step 4: 完成
      this.updateProgress('complete', 'Migration completed');

      const result: MigrationResult = {
        success: true,
        migrationType: 'cloud-to-local',
        migratedEntities: migratedCounts,
        conflicts: [],
        backupPath,
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    } catch (error) {
      this.logger.error('Migration failed', { error });

      const result: MigrationResult = {
        success: false,
        migrationType: 'cloud-to-local',
        migratedEntities: { goals: 0, tasks: 0, schedules: 0, reminders: 0 },
        conflicts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    }
  }

  /**
   * 合并两个账户的数据
   *
   * 场景：用户在多个设备上有不同的数据，需要合并
   */
  async mergeAccounts(
    config: MigrationConfig,
    conflictStrategy: ConflictResolutionStrategy = 'merge'
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    this.logger.info('Starting account merge', {
      source: config.sourceAccountUuid,
      target: config.targetAccountUuid,
      strategy: conflictStrategy,
    });

    this.initProgress('merge');

    try {
      // Step 1: 创建备份
      let backupPath: string | undefined;
      if (config.createBackup !== false) {
        this.updateProgress('backup', 'Creating backup...');
        backupPath = await this.createBackup(`merge-${Date.now()}`);
      }

      // Step 2: 收集两边数据
      this.updateProgress('collect', 'Collecting data from both accounts...');
      const sourceData = await this.dataCollector.collectAllData();
      // 实际场景中需要从云端获取数据
      // const targetData = await this.fetchCloudData(config.targetAccountUuid);

      // Step 3: 检测冲突
      this.updateProgress('conflict', 'Detecting conflicts...');
      const conflicts: MigrationConflict[] = [];
      // TODO: 实现冲突检测逻辑

      // Step 4: 解决冲突并合并
      this.updateProgress('merge', 'Merging data...');
      // TODO: 根据策略解决冲突

      // Step 5: 应用合并结果
      this.updateProgress('apply', 'Applying merged data...');
      // TODO: 应用合并后的数据

      // Step 6: 完成
      this.updateProgress('complete', 'Merge completed');

      const result: MigrationResult = {
        success: true,
        migrationType: 'merge',
        migratedEntities: {
          goals: sourceData.goals?.length || 0,
          tasks: sourceData.tasks?.length || 0,
          schedules: sourceData.schedules?.length || 0,
          reminders: sourceData.reminders?.length || 0,
        },
        conflicts,
        backupPath,
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    } catch (error) {
      this.logger.error('Merge failed', { error });

      const result: MigrationResult = {
        success: false,
        migrationType: 'merge',
        migratedEntities: { goals: 0, tasks: 0, schedules: 0, reminders: 0 },
        conflicts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };

      this.migrationHistory.push(result);
      this.currentMigration = null;

      return result;
    }
  }

  // ============ 备份与恢复 ============

  /**
   * 创建数据备份
   */
  async createBackup(identifier: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${identifier}-${timestamp}`;
    const backupPath = path.join(this.backupBaseDir, backupName);

    this.logger.info('Creating backup', { path: backupPath });

    // 确保目录存在
    await fs.promises.mkdir(backupPath, { recursive: true });

    // 收集所有数据
    const data = await this.dataCollector.collectAllData();

    // 保存数据
    const backupFile = path.join(backupPath, 'data.json');
    await fs.promises.writeFile(backupFile, JSON.stringify(data, null, 2), 'utf-8');

    // 保存元数据
    const metadataFile = path.join(backupPath, 'metadata.json');
    await fs.promises.writeFile(
      metadataFile,
      JSON.stringify(
        {
          identifier,
          timestamp,
          createdAt: Date.now(),
          version: '1.0',
          counts: {
            goals: data.goals?.length || 0,
            tasks: data.tasks?.length || 0,
            schedules: data.schedules?.length || 0,
            reminders: data.reminders?.length || 0,
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    this.logger.info('Backup created', { path: backupPath });
    return backupPath;
  }

  /**
   * 从备份恢复数据
   */
  async restoreFromBackup(backupPath: string): Promise<boolean> {
    this.logger.info('Restoring from backup', { path: backupPath });

    try {
      // 读取备份数据
      const dataFile = path.join(backupPath, 'data.json');
      const dataContent = await fs.promises.readFile(dataFile, 'utf-8');
      const data: SyncDataBundle = JSON.parse(dataContent);

      // 应用数据
      await this.dataCollector.applyData(data);

      this.logger.info('Backup restored successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to restore backup', { error });
      return false;
    }
  }

  /**
   * 列出所有备份
   */
  async listBackups(): Promise<
    Array<{
      name: string;
      path: string;
      createdAt: number;
      identifier: string;
    }>
  > {
    try {
      const entries = await fs.promises.readdir(this.backupBaseDir, { withFileTypes: true });
      const backups: Array<{
        name: string;
        path: string;
        createdAt: number;
        identifier: string;
      }> = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = path.join(this.backupBaseDir, entry.name, 'metadata.json');
          try {
            const content = await fs.promises.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(content);
            backups.push({
              name: entry.name,
              path: path.join(this.backupBaseDir, entry.name),
              createdAt: metadata.createdAt,
              identifier: metadata.identifier,
            });
          } catch {
            // 无效的备份目录
          }
        }
      }

      return backups.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.logger.error('Failed to list backups', { error });
      return [];
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupPath: string): Promise<boolean> {
    try {
      await fs.promises.rm(backupPath, { recursive: true });
      this.logger.info('Backup deleted', { path: backupPath });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete backup', { error });
      return false;
    }
  }

  // ============ 进度追踪 ============

  /**
   * 初始化进度
   */
  private initProgress(type: MigrationType): void {
    this.currentMigration = {
      status: 'in-progress',
      currentStep: 'init',
      totalSteps: type === 'merge' ? 6 : 4,
      completedSteps: 0,
      percentage: 0,
      message: 'Initializing migration...',
      startTime: Date.now(),
    };

    this.notifyProgress();
  }

  /**
   * 更新进度
   */
  private updateProgress(step: string, message: string): void {
    if (this.currentMigration) {
      this.currentMigration.completedSteps++;
      this.currentMigration.currentStep = step;
      this.currentMigration.message = message;
      this.currentMigration.percentage = Math.round(
        (this.currentMigration.completedSteps / this.currentMigration.totalSteps) * 100
      );

      if (step === 'complete') {
        this.currentMigration.status = 'completed';
        this.currentMigration.endTime = Date.now();
      }

      this.notifyProgress();
    }
  }

  /**
   * 通知进度
   */
  private notifyProgress(): void {
    if (this.currentMigration) {
      for (const callback of this.progressCallbacks) {
        try {
          callback(this.currentMigration);
        } catch (error) {
          this.logger.error('Progress callback error', { error });
        }
      }
    }
  }

  /**
   * 添加进度回调
   */
  onProgress(callback: (progress: MigrationProgress) => void): void {
    this.progressCallbacks.add(callback);
  }

  /**
   * 移除进度回调
   */
  offProgress(callback: (progress: MigrationProgress) => void): void {
    this.progressCallbacks.delete(callback);
  }

  /**
   * 获取当前迁移进度
   */
  getProgress(): MigrationProgress | null {
    return this.currentMigration;
  }

  /**
   * 获取迁移历史
   */
  getHistory(): MigrationResult[] {
    return [...this.migrationHistory];
  }

  // ============ 辅助方法 ============

  /**
   * 确保备份目录存在
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupBaseDir)) {
      fs.mkdirSync(this.backupBaseDir, { recursive: true });
    }
  }

  /**
   * 更新数据的账户关联
   */
  private async updateAccountAssociations(
    data: SyncDataBundle,
    _sourceUuid: string,
    _targetUuid: string
  ): Promise<{ goals: number; tasks: number; schedules: number; reminders: number }> {
    // TODO: 实现账户关联更新
    // 这需要访问数据库直接更新 accountUuid 字段

    this.logger.info('Updating account associations', {
      goals: data.goals?.length || 0,
      tasks: data.tasks?.length || 0,
      schedules: data.schedules?.length || 0,
      reminders: data.reminders?.length || 0,
    });

    return {
      goals: data.goals?.length || 0,
      tasks: data.tasks?.length || 0,
      schedules: data.schedules?.length || 0,
      reminders: data.reminders?.length || 0,
    };
  }
}

/**
 * 获取 DataMigrationService 实例
 */
export function getDataMigrationService(logger?: ILogger): DataMigrationService {
  return DataMigrationService.getInstance(logger);
}
