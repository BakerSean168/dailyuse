/**
 * DataExportImportService - 数据导入/导出服务
 *
 * 提供数据的文件导入导出功能：
 * - 支持 JSON 格式导出
 * - 支持 CSV 格式导出（部分数据类型）
 * - 文件选择对话框集成
 * - 数据验证和错误处理
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import { dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { SyncDataBundle } from '@dailyuse/contracts/sync';
import { DataCollector } from './DataCollector';

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv';

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format?: ExportFormat;
  /** 是否包含目标 */
  includeGoals?: boolean;
  /** 是否包含任务 */
  includeTasks?: boolean;
  /** 是否包含日程 */
  includeSchedules?: boolean;
  /** 是否包含提醒 */
  includeReminders?: boolean;
  /** 是否包含设置 */
  includeSettings?: boolean;
  /** 是否美化输出 */
  pretty?: boolean;
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 是否覆盖现有数据 */
  overwrite?: boolean;
  /** 是否合并数据 */
  merge?: boolean;
  /** 冲突策略 */
  conflictStrategy?: 'keep-local' | 'keep-import' | 'skip';
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean;
  filePath?: string;
  format?: ExportFormat;
  exportedCounts?: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
  };
  error?: string;
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  importedCounts?: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
  };
  skippedCounts?: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
  };
  errors?: string[];
  error?: string;
}

/**
 * 数据导入/导出服务
 */
export class DataExportImportService {
  private static instance: DataExportImportService | null = null;

  private readonly logger: ILogger;
  private readonly dataCollector: DataCollector;

  private constructor(logger?: ILogger) {
    this.logger = logger || createLogger('DataExportImportService');
    this.dataCollector = DataCollector.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(logger?: ILogger): DataExportImportService {
    if (!DataExportImportService.instance) {
      DataExportImportService.instance = new DataExportImportService(logger);
    }
    return DataExportImportService.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    DataExportImportService.instance = null;
  }

  // ============ 导出功能 ============

  /**
   * 导出数据到文件（带文件选择对话框）
   */
  async exportWithDialog(
    parentWindow: BrowserWindow | null,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const format = options.format || 'json';

    // 显示保存对话框
    const result = await dialog.showSaveDialog(parentWindow || BrowserWindow.getFocusedWindow()!, {
      title: '导出数据',
      defaultPath: path.join(
        app.getPath('documents'),
        `dailyuse-export-${new Date().toISOString().split('T')[0]}.${format}`
      ),
      filters: [
        { name: 'JSON 文件', extensions: ['json'] },
        { name: 'CSV 文件', extensions: ['csv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        error: 'Export cancelled',
      };
    }

    // 执行导出
    return await this.exportToFile(result.filePath, options);
  }

  /**
   * 导出数据到指定文件
   */
  async exportToFile(filePath: string, options: ExportOptions = {}): Promise<ExportResult> {
    this.logger.info('Exporting data', { filePath, options });

    try {
      // 收集数据
      const allData = await this.dataCollector.collectAllData();

      // 根据选项过滤数据
      const exportData = this.filterDataForExport(allData, options);

      // 获取格式
      const format = options.format || this.getFormatFromPath(filePath);

      // 序列化数据
      let content: string;
      if (format === 'csv') {
        content = this.convertToCSV(exportData);
      } else {
        content = JSON.stringify(exportData, null, options.pretty !== false ? 2 : 0);
      }

      // 写入文件
      await fs.promises.writeFile(filePath, content, 'utf-8');

      this.logger.info('Data exported successfully', { filePath });

      return {
        success: true,
        filePath,
        format,
        exportedCounts: {
          goals: exportData.goals?.length || 0,
          tasks: exportData.tasks?.length || 0,
          schedules: exportData.schedules?.length || 0,
          reminders: exportData.reminders?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error('Export failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 导出数据为字符串
   */
  async exportToString(options: ExportOptions = {}): Promise<string> {
    const allData = await this.dataCollector.collectAllData();
    const exportData = this.filterDataForExport(allData, options);

    if (options.format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, options.pretty !== false ? 2 : 0);
  }

  // ============ 导入功能 ============

  /**
   * 从文件导入数据（带文件选择对话框）
   */
  async importWithDialog(
    parentWindow: BrowserWindow | null,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // 显示打开对话框
    const result = await dialog.showOpenDialog(parentWindow || BrowserWindow.getFocusedWindow()!, {
      title: '导入数据',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'JSON 文件', extensions: ['json'] },
        { name: 'CSV 文件', extensions: ['csv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        error: 'Import cancelled',
      };
    }

    // 执行导入
    return await this.importFromFile(result.filePaths[0], options);
  }

  /**
   * 从指定文件导入数据
   */
  async importFromFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    this.logger.info('Importing data', { filePath, options });

    try {
      // 读取文件
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 解析数据
      const format = this.getFormatFromPath(filePath);
      let importData: SyncDataBundle;

      if (format === 'csv') {
        importData = this.parseCSV(content);
      } else {
        importData = JSON.parse(content);
      }

      // 验证数据
      const validationErrors = this.validateImportData(importData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          error: 'Data validation failed',
        };
      }

      // 应用数据
      const result = await this.applyImportData(importData, options);

      this.logger.info('Data imported successfully', result);
      return result;
    } catch (error) {
      this.logger.error('Import failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 从字符串导入数据
   */
  async importFromString(
    content: string,
    format: ExportFormat = 'json',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      let importData: SyncDataBundle;

      if (format === 'csv') {
        importData = this.parseCSV(content);
      } else {
        importData = JSON.parse(content);
      }

      const validationErrors = this.validateImportData(importData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          error: 'Data validation failed',
        };
      }

      return await this.applyImportData(importData, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============ 辅助方法 ============

  /**
   * 根据选项过滤导出数据
   */
  private filterDataForExport(data: SyncDataBundle, options: ExportOptions): SyncDataBundle {
    const result: SyncDataBundle = {};

    if (options.includeGoals !== false) {
      result.goals = data.goals;
    }

    if (options.includeTasks !== false) {
      result.tasks = data.tasks;
    }

    if (options.includeSchedules !== false) {
      result.schedules = data.schedules;
    }

    if (options.includeReminders !== false) {
      result.reminders = data.reminders;
    }

    if (options.includeSettings !== false) {
      result.settings = data.settings;
    }

    return result;
  }

  /**
   * 从文件路径获取格式
   */
  private getFormatFromPath(filePath: string): ExportFormat {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.csv' ? 'csv' : 'json';
  }

  /**
   * 转换为 CSV 格式
   */
  private convertToCSV(data: SyncDataBundle): string {
    const lines: string[] = [];

    // 导出 Goals
    if (data.goals && data.goals.length > 0) {
      lines.push('# Goals');
      lines.push('uuid,title,description,status,priority,startDate,endDate,progress,tags,parentGoalUuid');
      for (const goal of data.goals) {
        lines.push(
          [
            this.escapeCSV(goal.uuid),
            this.escapeCSV(goal.title),
            this.escapeCSV(goal.description || ''),
            this.escapeCSV(goal.status),
            goal.priority || 0,
            goal.startDate || '',
            goal.endDate || '',
            goal.progress || 0,
            this.escapeCSV(goal.tags?.join(';') || ''),
            this.escapeCSV(goal.parentGoalUuid || ''),
          ].join(',')
        );
      }
      lines.push('');
    }

    // 导出 Tasks
    if (data.tasks && data.tasks.length > 0) {
      lines.push('# Tasks');
      lines.push('uuid,title,description,status,priority,dueDate,estimatedMinutes,tags,goalUuid');
      for (const task of data.tasks) {
        lines.push(
          [
            this.escapeCSV(task.uuid),
            this.escapeCSV(task.title),
            this.escapeCSV(task.description || ''),
            this.escapeCSV(task.status),
            task.priority || 0,
            task.dueDate || '',
            task.estimatedMinutes || '',
            this.escapeCSV(task.tags?.join(';') || ''),
            this.escapeCSV(task.goalUuid || ''),
          ].join(',')
        );
      }
      lines.push('');
    }

    // 导出 Reminders
    if (data.reminders && data.reminders.length > 0) {
      lines.push('# Reminders');
      lines.push('uuid,title,message,triggerAt,isCompleted,type');
      for (const reminder of data.reminders) {
        lines.push(
          [
            this.escapeCSV(reminder.uuid),
            this.escapeCSV(reminder.title),
            this.escapeCSV(reminder.message || ''),
            reminder.triggerAt || '',
            reminder.isCompleted ? 'true' : 'false',
            this.escapeCSV(reminder.type || ''),
          ].join(',')
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * 解析 CSV 格式
   */
  private parseCSV(content: string): SyncDataBundle {
    const result: SyncDataBundle = {
      goals: [],
      tasks: [],
      schedules: [],
      reminders: [],
    };

    const lines = content.split('\n');
    let currentSection = '';
    let headers: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      if (trimmedLine.startsWith('# ')) {
        currentSection = trimmedLine.substring(2).toLowerCase();
        headers = [];
        continue;
      }

      if (headers.length === 0) {
        headers = this.parseCSVLine(trimmedLine);
        continue;
      }

      const values = this.parseCSVLine(trimmedLine);
      const record: Record<string, string> = {};

      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = values[i] || '';
      }

      switch (currentSection) {
        case 'goals':
          result.goals!.push({
            uuid: record['uuid'] || '',
            title: record['title'] || '',
            description: record['description'],
            status: record['status'] || 'active',
            priority: parseInt(record['priority']) || 0,
            startDate: record['startDate'] ? parseInt(record['startDate']) : undefined,
            endDate: record['endDate'] ? parseInt(record['endDate']) : undefined,
            progress: parseInt(record['progress']) || 0,
            tags: record['tags'] ? record['tags'].split(';').filter(Boolean) : [],
            parentGoalUuid: record['parentGoalUuid'] || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          break;

        case 'tasks':
          result.tasks!.push({
            uuid: record['uuid'] || '',
            title: record['title'] || '',
            description: record['description'],
            status: record['status'] || 'pending',
            priority: parseInt(record['priority']) || 0,
            dueDate: record['dueDate'] ? parseInt(record['dueDate']) : undefined,
            estimatedMinutes: record['estimatedMinutes']
              ? parseInt(record['estimatedMinutes'])
              : undefined,
            tags: record['tags'] ? record['tags'].split(';').filter(Boolean) : [],
            goalUuid: record['goalUuid'] || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          break;

        case 'reminders':
          result.reminders!.push({
            uuid: record['uuid'] || '',
            title: record['title'] || '',
            message: record['message'],
            triggerAt: record['triggerAt'] ? parseInt(record['triggerAt']) : Date.now(),
            isCompleted: record['isCompleted'] === 'true',
            type: record['type'] || 'reminder',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          break;
      }
    }

    return result;
  }

  /**
   * 解析 CSV 行
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * 转义 CSV 字段
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * 验证导入数据
   */
  private validateImportData(data: SyncDataBundle): string[] {
    const errors: string[] = [];

    // 验证基本结构
    if (typeof data !== 'object' || data === null) {
      errors.push('Invalid data format: expected an object');
      return errors;
    }

    // 验证 goals
    if (data.goals) {
      if (!Array.isArray(data.goals)) {
        errors.push('Invalid goals format: expected an array');
      } else {
        data.goals.forEach((goal, index) => {
          if (!goal.uuid) {
            errors.push(`Goal at index ${index} missing uuid`);
          }
          if (!goal.title) {
            errors.push(`Goal at index ${index} missing title`);
          }
        });
      }
    }

    // 验证 tasks
    if (data.tasks) {
      if (!Array.isArray(data.tasks)) {
        errors.push('Invalid tasks format: expected an array');
      } else {
        data.tasks.forEach((task, index) => {
          if (!task.uuid) {
            errors.push(`Task at index ${index} missing uuid`);
          }
          if (!task.title) {
            errors.push(`Task at index ${index} missing title`);
          }
        });
      }
    }

    // 验证 reminders
    if (data.reminders) {
      if (!Array.isArray(data.reminders)) {
        errors.push('Invalid reminders format: expected an array');
      } else {
        data.reminders.forEach((reminder, index) => {
          if (!reminder.uuid) {
            errors.push(`Reminder at index ${index} missing uuid`);
          }
          if (!reminder.title) {
            errors.push(`Reminder at index ${index} missing title`);
          }
        });
      }
    }

    return errors;
  }

  /**
   * 应用导入的数据
   */
  private async applyImportData(
    data: SyncDataBundle,
    options: ImportOptions
  ): Promise<ImportResult> {
    const importedCounts = {
      goals: 0,
      tasks: 0,
      schedules: 0,
      reminders: 0,
    };

    const skippedCounts = {
      goals: 0,
      tasks: 0,
      schedules: 0,
      reminders: 0,
    };

    // 使用 DataCollector 应用数据
    // 如果需要更精细的控制，可以直接调用各个服务
    await this.dataCollector.applyData(data);

    // 统计导入数量
    importedCounts.goals = data.goals?.length || 0;
    importedCounts.tasks = data.tasks?.length || 0;
    importedCounts.schedules = data.schedules?.length || 0;
    importedCounts.reminders = data.reminders?.length || 0;

    return {
      success: true,
      importedCounts,
      skippedCounts,
    };
  }
}

/**
 * 获取 DataExportImportService 实例
 */
export function getDataExportImportService(logger?: ILogger): DataExportImportService {
  return DataExportImportService.getInstance(logger);
}
