export type RecommendationFilters = {
  searchQuery?: string;
  category?: string;
  role?: string;
};

type TemplateResult = {
  template: {
    id: string;
    title: string;
    description: string;
    category: string;
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
  };
  score: number;
  reasons: string[];
};

const templates: TemplateResult[] = [];

const service = {
  recommendTemplates(filters: RecommendationFilters): TemplateResult[] {
    const keyword = filters.searchQuery?.trim().toLowerCase();

    return templates
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
