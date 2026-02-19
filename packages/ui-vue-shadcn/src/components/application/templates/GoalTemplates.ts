/**
 * Goal Template type shim for ui-vue-shadcn
 * This provides the GoalTemplate interface used by TemplateBrowser.vue
 */

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'engineering' | 'sales' | 'marketing' | 'general';
  tags: string[];
  roles: string[];
  industries: string[];
  suggestedDuration: number;
  keyResults: Array<{
    title: string;
    suggestedWeight: number;
    metrics: string[];
    suggestedStartValue?: number;
    suggestedTargetValue?: number;
    unit?: string;
  }>;
}
