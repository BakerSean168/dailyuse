/**
 * Export/Import Data Services
 *
 * 数据导入导出用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type {
  ExportDataRequest,
  ExportDataResponse,
  ImportDataRequest,
  ImportDataResponse,
} from '@dailyuse/contracts/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Export Data
 */
export class ExportData {
  private static instance: ExportData;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): ExportData {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ExportData.instance = new ExportData(client);
    return ExportData.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ExportData {
    if (!ExportData.instance) {
      ExportData.instance = ExportData.createInstance();
    }
    return ExportData.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ExportData.instance = undefined as unknown as ExportData;
  }

  /**
   * 执行用例
   */
  async execute(request: ExportDataRequest): Promise<ExportDataResponse> {
    return this.apiClient.exportData(request);
  }
}

/**
 * Import Data
 */
export class ImportData {
  private static instance: ImportData;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): ImportData {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ImportData.instance = new ImportData(client);
    return ImportData.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ImportData {
    if (!ImportData.instance) {
      ImportData.instance = ImportData.createInstance();
    }
    return ImportData.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ImportData.instance = undefined as unknown as ImportData;
  }

  /**
   * 执行用例
   */
  async execute(request: ImportDataRequest): Promise<ImportDataResponse> {
    return this.apiClient.importData(request);
  }
}
