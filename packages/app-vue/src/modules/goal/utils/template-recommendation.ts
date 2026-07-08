import { BUILT_IN_TEMPLATES, type GoalTemplate } from '@dailyuse/goal/client';

export type RecommendationFilters = {
  searchQuery?: string;
  category?: string;
  role?: string;
};

type TemplateResult = {
  template: GoalTemplate;
  score: number;
  reasons: string[];
};

const scoreTemplate = (template: GoalTemplate, filters: RecommendationFilters): number => {
  let score = 0;
  if (filters.category && template.category === filters.category) score += 3;
  if (filters.role && template.roles.includes(filters.role)) score += 2;
  const keyword = filters.searchQuery?.trim().toLowerCase();
  if (keyword) {
    const haystack = [template.title, template.description, ...template.tags]
      .join(' ')
      .toLowerCase();
    if (haystack.includes(keyword)) score += 1;
  }
  return score;
};

const service = {
  recommendTemplates(filters: RecommendationFilters): TemplateResult[] {
    const keyword = filters.searchQuery?.trim().toLowerCase();

    return BUILT_IN_TEMPLATES.map((template) => ({
      template,
      score: scoreTemplate(template, filters),
      reasons: [],
    }))
      .filter((result) => {
        if (filters.category && result.template.category !== filters.category) return false;
        if (filters.role && !result.template.roles.includes(filters.role)) return false;
        if (!keyword) return true;

        const haystack = [
          result.template.title,
          result.template.description,
          ...result.template.tags,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .sort((left, right) => right.score - left.score);
  },
};

export default service;
