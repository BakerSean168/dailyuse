/**
 * Dashboard Application Service - Renderer
 *
 * This service acts as a facade for dashboard-related operations in the renderer process.
 * It interfaces with the `@dailyuse/application-client` layer to communicate with the main process.
 * application-client 已返回 Entity 对象，直接透传
 *
 * @module renderer/modules/dashboard/application/services
 */

import {
  // Statistics
  getDashboardStatistics,
  refreshDashboardStatistics,
  // Config
  getDashboardConfig,
  updateDashboardConfig,
  resetDashboardConfig,
  // Types
  type UpdateDashboardConfigInput,
} from '@dailyuse/application-client';
import type { DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import type { DashboardConfig } from '@dailyuse/domain-client/dashboard';

/**
 * Service class for managing Dashboard data and configuration.
 * Implements the Singleton pattern.
 */
export class DashboardApplicationService {
  private static instance: DashboardApplicationService;

  private constructor() {}

  /**
   * Retrieves the singleton instance of DashboardApplicationService.
   *
   * @returns {DashboardApplicationService} The singleton instance.
   */
  static getInstance(): DashboardApplicationService {
    if (!DashboardApplicationService.instance) {
      DashboardApplicationService.instance = new DashboardApplicationService();
    }
    return DashboardApplicationService.instance;
  }

  // ===== Statistics Operations =====

  /**
   * Fetches the current dashboard statistics.
   *
   * @returns {Promise<DashboardStatisticsClientDTO>} A promise that resolves to the statistics DTO.
   */
  async getDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return getDashboardStatistics();
  }

  /**
   * Forces a recalculation and refresh of the dashboard statistics.
   *
   * @returns {Promise<DashboardStatisticsClientDTO>} A promise that resolves to the updated statistics DTO.
   */
  async refreshDashboardStatistics(): Promise<DashboardStatisticsClientDTO> {
    return refreshDashboardStatistics();
  }

  // ===== Config Operations =====

  /**
   * Retrieves the current dashboard configuration.
   *
   * @returns {Promise<DashboardConfig>} A promise that resolves to the configuration Entity.
   */
  async getDashboardConfig(): Promise<DashboardConfig> {
    return getDashboardConfig();
  }

  /**
   * Updates the dashboard configuration.
   *
   * @param {UpdateDashboardConfigInput} input - The partial configuration to update.
   * @returns {Promise<DashboardConfig>} A promise that resolves to the updated configuration Entity.
   */
  async updateDashboardConfig(input: UpdateDashboardConfigInput): Promise<DashboardConfig> {
    return updateDashboardConfig(input);
  }

  /**
   * Resets the dashboard configuration to its default state.
   *
   * @returns {Promise<DashboardConfig>} A promise that resolves to the default configuration Entity.
   */
  async resetDashboardConfig(): Promise<DashboardConfig> {
    return resetDashboardConfig();
  }
}

// Singleton instance export
export const dashboardApplicationService = DashboardApplicationService.getInstance();
