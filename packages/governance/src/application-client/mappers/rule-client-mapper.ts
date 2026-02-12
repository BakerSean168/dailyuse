/**
 * RuleClientMapper - Client DTO Mapping
 * 规则客户端映射器
 * 
 * Converts between client DTOs and view models for UI consumption
 */

import type { RuleClientDTO } from '@/contracts/aggregates/rule-client';

export interface RuleViewModel extends RuleClientDTO {
  // UI-specific computed properties
  displayStatus: string;
  canEdit: boolean;
  isDeprecated: boolean;
  hasReplacement: boolean;
}

/**
 * Rule Client Mapper
 * 
 * Maps client DTOs to view models with UI-specific enhancements
 */
export class RuleClientMapper {
  /**
   * Converts RuleClientDTO to RuleViewModel
   */
  static toViewModel(dto: RuleClientDTO, currentUserRole?: string): RuleViewModel {
    const isDeprecated = dto.status === 'Deprecated';
    const canEdit = currentUserRole === 'TechLead' || currentUserRole === 'Architect';

    return {
      ...dto,
      displayStatus: this.formatStatus(dto.status),
      canEdit,
      isDeprecated,
      hasReplacement: !!dto.replacementRuleId,
    };
  }

  /**
   * Bulk conversion helper
   */
  static toViewModels(dtos: RuleClientDTO[], currentUserRole?: string): RuleViewModel[] {
    return dtos.map(dto => this.toViewModel(dto, currentUserRole));
  }

  /**
   * Formats status for display
   */
  private static formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      Draft: '草稿',
      Active: '生效中',
      Deprecated: '已废弃',
    };

    return statusMap[status] || status;
  }
}
