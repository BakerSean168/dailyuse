/**
 * Governance UI display model helpers.
 * Governance UI 展示模型辅助函数。
 *
 * Governance DTOs stay as the single data truth.
 * App-vue derives only the lightweight fields the UI needs.
 *
 * governance DTO 继续作为单一数据真值。
 * app-vue 只派生 UI 需要的轻量字段。
 */

import type { RuleClientDTO } from '@dailyuse/contracts/governance';

export type GovernanceDisplayRule = Omit<RuleClientDTO, 'createdAt' | 'updatedAt'> & {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  hasTag(tag: string): boolean;
};

export function toGovernanceDisplayRule(
  dto: RuleClientDTO | null,
): GovernanceDisplayRule | null {
  if (!dto) {
    return null;
  }

  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    hasTag(tag: string): boolean {
      return dto.tags.some((item) => item.value.toLowerCase() === tag.toLowerCase());
    },
  };
}
