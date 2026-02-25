/**
 * RuleClientService - Client-side Rule Service
 * 规则客户端服务
 *
 * Provides client-side operations for Rule management:
 * - Fetches rules from API
 * - Caches results locally
 * - Provides reactive state management
 * - Handles optimistic updates
 *
 * This service is framework-agnostic and can be used in:
 * - Vue 3 applications (via Pinia stores)
 * - React applications (via hooks)
 * - Vanilla JS applications
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type {
  CreateRuleReq,
  ListRulesQuery,
  SearchRulesQuery,
  UpdateRuleReq,
} from '../../contracts/api/rules';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';

export interface FetchRulesOptions {
  status?: string | string[];
  severity?: string | string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchRulesOptions {
  query: string;
  status?: string | string[];
  limit?: number;
}

/**
 * Rule Client Service
 *
 * Framework-agnostic service for client-side rule operations
 */
export class RuleClientService {
  constructor(private readonly apiClient: IRuleApiClient) {}

  private toStatus(value?: string | string[]): ListRulesQuery['status'] {
    const status = Array.isArray(value) ? value[0] : value;
    if (status === 'Draft' || status === 'Active' || status === 'Deprecated') {
      return status;
    }
    return undefined;
  }

  private toSeverity(value?: string | string[]): ListRulesQuery['severity'] {
    const severity = Array.isArray(value) ? value[0] : value;
    if (severity === 'Mandatory' || severity === 'Recommended') {
      return severity;
    }
    return undefined;
  }

  /**
   * Fetches all rules with optional filters
   */
  async fetchRules(options?: FetchRulesOptions): Promise<Result<RuleClientDTO[]>> {
    const query: ListRulesQuery = {
      status: this.toStatus(options?.status),
      severity: this.toSeverity(options?.severity),
      tags: options?.tags,
      page:
        options?.offset !== undefined && options?.limit
          ? Math.floor(options.offset / options.limit) + 1
          : 1,
      pageSize: options?.limit ?? 20,
    };

    const result = await this.apiClient.listRules(query);
    if (!result.ok) return result;
    return ok(result.data.items);
  }

  /**
   * Fetches single rule by ID
   */
  async fetchRuleById(id: string): Promise<Result<RuleClientDTO | null>> {
    const result = await this.apiClient.getRule({ id });
    if (!result.ok) return result;
    return ok(result.data);
  }

  /**
   * Searches rules by keyword
   */
  async searchRules(options: SearchRulesOptions): Promise<Result<RuleClientDTO[]>> {
    const query: SearchRulesQuery = {
      query: options.query,
      status: this.toStatus(options.status),
      page: 1,
      pageSize: options.limit ?? 20,
    };

    const result = await this.apiClient.searchRules(query);
    if (!result.ok) return result;
    return ok(result.data.items);
  }

  /**
   * Creates new rule (Tech Lead/Architect only)
   */
  async createRule(data: CreateRuleReq): Promise<Result<{ ruleId: string }>> {
    const result = await this.apiClient.createRule(data);
    if (!result.ok) return result;
    return ok({ ruleId: result.data.id });
  }

  /**
   * Updates existing rule (Tech Lead/Architect only)
   */
  async updateRule(id: string, data: UpdateRuleReq): Promise<Result<void>> {
    const result = await this.apiClient.updateRule(id, data);
    if (!result.ok) return result;
    return ok(undefined);
  }

  /**
   * Deletes rule (Tech Lead/Architect only)
   */
  async deleteRule(id: string): Promise<Result<void>> {
    const result = await this.apiClient.deleteRule({ id });
    if (!result.ok) return result;
    if (!result.data.success) {
      return error('DELETE_FAILED', 'Rule delete operation failed');
    }
    return ok(undefined);
  }
}
