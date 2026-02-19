type KeyResultLike = {
  title: string;
  weight?: number | null;
};

export type WeightStrategy = {
  name: string;
  label: string;
  description: string;
  confidence: number;
  weights: number[];
  reasoning: string;
};

const normalizeWeights = (weights: number[]) => {
  if (weights.length === 0) return [];
  const safe = weights.map((weight) => Math.max(0, weight));
  const total = safe.reduce((sum, weight) => sum + weight, 0) || 1;
  const normalized = safe.map((weight) => Math.round((weight / total) * 100));
  const diff = 100 - normalized.reduce((sum, weight) => sum + weight, 0);
  if (normalized.length > 0 && diff !== 0) {
    normalized[0] += diff;
  }
  return normalized;
};

const buildEqualWeights = (count: number) => {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const weights = Array.from({ length: count }, () => base);
  const rest = 100 - base * count;
  for (let index = 0; index < rest; index += 1) {
    weights[index] += 1;
  }
  return weights;
};

const buildKeywordPriority = (keyResults: KeyResultLike[]) => {
  const keywords = ['critical', 'urgent', 'important', 'key', '核心', '关键', '重要', '紧急'];
  const scores = keyResults.map((kr) => {
    const title = kr.title.toLowerCase();
    const hits = keywords.filter((keyword) => title.includes(keyword.toLowerCase())).length;
    return 1 + hits;
  });
  return normalizeWeights(scores);
};

const buildCurrentTrend = (keyResults: KeyResultLike[]) => {
  const base = keyResults.map((kr) => (kr.weight && kr.weight > 0 ? kr.weight : 1));
  return normalizeWeights(base);
};

export const weightRecommendationService = {
  recommendWeights(keyResults: KeyResultLike[]): WeightStrategy[] {
    const count = keyResults.length;
    if (count === 0) return [];

    return [
      {
        name: 'balanced',
        label: '均衡策略',
        description: '各关键结果平均分配权重，适合稳定推进阶段',
        confidence: 82,
        weights: buildEqualWeights(count),
        reasoning: '当前目标结构较均衡，建议采用平均分配以保持整体推进。',
      },
      {
        name: 'keyword-priority',
        label: '关键词优先',
        description: '根据标题关键词提取重点，提升关键任务权重',
        confidence: 76,
        weights: buildKeywordPriority(keyResults),
        reasoning: '根据关键字命中情况识别高优先级 KR，适合聚焦核心突破。',
      },
      {
        name: 'current-trend',
        label: '沿用趋势',
        description: '基于当前权重微调，降低变更成本',
        confidence: 71,
        weights: buildCurrentTrend(keyResults),
        reasoning: '沿用当前分配趋势，减少剧烈调整带来的执行波动。',
      },
    ];
  },
};
