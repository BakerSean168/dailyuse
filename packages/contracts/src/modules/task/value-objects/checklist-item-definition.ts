/**
 * ChecklistItemDefinition Value Object
 *
 * Residual 853: ChecklistItemDefinitionDTO dual retired — sole ChecklistItemDefinition interface + type alias.
 */

// Residual 853: sole ChecklistItemDefinition body.
export interface ChecklistItemDefinition {
  title: string;
  order: number;
  // 注意：这里没有 isCompleted，因为模版是“死”的
}

// Residual 853: ChecklistItemDefinitionDTO dual retired — DTO is the ChecklistItemDefinition shape.
export type ChecklistItemDefinitionDTO = ChecklistItemDefinition;
