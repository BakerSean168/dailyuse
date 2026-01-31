export interface ChecklistItemDefinition {
  title: string;
  order: number;
  // 注意：这里没有 isCompleted，因为模版是“死”的
}

export interface ChecklistItemDefinitionDTO {
  title: string;
  order: number;
}