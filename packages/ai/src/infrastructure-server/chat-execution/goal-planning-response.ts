import {
  GoalCategory,
  type GeneratedGoalDraft,
  type KeyResultPreview,
} from '@dailyuse/contracts/ai';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

export function parseGoalPlanningResponse(
  content: string,
  now: number,
  includeKeyResults: boolean,
): {
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
} {
  const parsed = safeParseJson(stripCodeFence(content));
  const goalRecord = asRecord(parsed?.goal);
  const suggestedDurationDays = toPositiveInteger(goalRecord?.suggestedDurationDays) ?? 30;
  const suggestedEndDate = now + suggestedDurationDays * 24 * 60 * 60 * 1000;

  const goal: GeneratedGoalDraft = {
    title: toNonEmptyString(goalRecord?.title) ?? 'AI generated goal',
    description: toNonEmptyString(goalRecord?.description) ?? 'No description provided.',
    motivation: toOptionalString(goalRecord?.motivation),
    category: toGoalCategory(goalRecord?.category),
    importance: toImportanceLevel(goalRecord?.importance),
    tags: toStringArray(goalRecord?.tags),
    feasibilityAnalysis: toOptionalString(goalRecord?.feasibilityAnalysis),
    aiInsights: toOptionalString(goalRecord?.aiInsights),
    suggestedStartDate: now,
    suggestedEndDate,
  };

  const keyResults = includeKeyResults ? toKeyResults(parsed?.keyResults) : undefined;

  return {
    goal,
    keyResults: keyResults?.length ? keyResults : undefined,
  };
}

export function buildGoalGenerationSystemPrompt(): string {
  return [
    'You are an assistant that turns a rough idea into a practical personal goal draft.',
    'Respond with JSON only.',
    'Do not include markdown code fences.',
    'JSON shape:',
    '{',
    '  "goal": {',
    '    "title": string,',
    '    "description": string,',
    '    "motivation": string,',
    '    "category": "work" | "health" | "learning" | "personal" | "finance" | "relationship" | "other",',
    '    "importance": "Vital" | "Important" | "Moderate" | "Minor" | "Trivial",',
    '    "tags": string[],',
    '    "feasibilityAnalysis": string,',
    '    "aiInsights": string,',
    '    "suggestedDurationDays": number',
    '  },',
    '  "keyResults": [',
    '    {',
    '      "title": string,',
    '      "description": string,',
    '      "targetValue": number,',
    '      "unit": string',
    '    }',
    '  ]',
    '}',
    'Keep the output realistic, specific, and concise.',
  ].join('\n');
}

export function buildGoalGenerationUserPrompt(input: {
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
}): string {
  return [
    `Idea: ${input.idea}`,
    input.category ? `Preferred category: ${input.category}` : null,
    input.timeframe ? `Preferred timeframe: ${input.timeframe}` : null,
    `Include key results: ${input.includeKeyResults ? 'yes' : 'no'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();
}

function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return toNonEmptyString(value);
}

function toPositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : undefined;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];
}

function toGoalCategory(value: unknown): GoalCategory {
  switch (value) {
    case GoalCategory.WORK:
    case GoalCategory.HEALTH:
    case GoalCategory.LEARNING:
    case GoalCategory.PERSONAL:
    case GoalCategory.FINANCE:
    case GoalCategory.RELATIONSHIP:
    case GoalCategory.OTHER:
      return value;
    default:
      return GoalCategory.OTHER;
  }
}

function toImportanceLevel(value: unknown): GeneratedGoalDraft['importance'] {
  switch (value) {
    case ImportanceLevel.Vital:
    case ImportanceLevel.Important:
    case ImportanceLevel.Moderate:
    case ImportanceLevel.Minor:
    case ImportanceLevel.Trivial:
      return value;
    default:
      return ImportanceLevel.Moderate;
  }
}

function toKeyResults(value: unknown): KeyResultPreview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => ({
      title: toNonEmptyString(item.title) ?? 'Review generated draft',
      description: toOptionalString(item.description),
      targetValue: toPositiveInteger(item.targetValue) ?? 1,
      unit: toNonEmptyString(item.unit) ?? 'step',
    }));
}
