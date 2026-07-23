import {
  GoalCategory,
  type GeneratedGoalDraft,
  type KeyResultPreview,
} from '@dailyuse/contracts/ai';
import {
  KeyResultCalculationMethod,
  KeyResultValueType,
} from '@dailyuse/contracts/goal';
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
  const suggestedStartDate = toTimestamp(goalRecord?.suggestedStartDate) ?? now;
  const suggestedDurationDays = toPositiveInteger(goalRecord?.suggestedDurationDays) ?? 30;
  const suggestedEndDate =
    toTimestamp(goalRecord?.suggestedEndDate) ??
    suggestedStartDate + suggestedDurationDays * 24 * 60 * 60 * 1000;

  const goal: GeneratedGoalDraft = {
    title: toNonEmptyString(goalRecord?.title) ?? 'AI generated goal',
    description: toNonEmptyString(goalRecord?.description) ?? 'No description provided.',
    motivation: toOptionalString(goalRecord?.motivation),
    category: toGoalCategory(goalRecord?.category),
    importance: toImportanceLevel(goalRecord?.importance),
    tags: toStringArray(goalRecord?.tags),
    feasibilityAnalysis: toOptionalString(goalRecord?.feasibilityAnalysis),
    aiInsights: toOptionalString(goalRecord?.aiInsights),
    suggestedStartDate,
    suggestedEndDate:
      suggestedEndDate >= suggestedStartDate
        ? suggestedEndDate
        : suggestedStartDate + 30 * 24 * 60 * 60 * 1000,
  };

  const keyResults = includeKeyResults ? toKeyResults(parsed?.keyResults) : undefined;

  return {
    goal,
    keyResults: keyResults?.length ? keyResults : undefined,
  };
}

export function buildGoalGenerationSystemPrompt(): string {
  return [
    'You are an assistant that turns a rough idea into a practical personal goal draft that is ready for a goal creation form.',
    'Respond with JSON only.',
    'Do not include markdown code fences.',
    'Be concrete. Preserve any numbers, dates, and progress already provided by the user.',
    'If a number is unknown, make a reasonable default and keep it internally consistent.',
    'If the user already gave current progress, copy it into both startValue and currentValue unless a better start value is explicit.',
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
    '    "suggestedStartDate": "YYYY-MM-DD" | number,',
    '    "suggestedEndDate": "YYYY-MM-DD" | number,',
    '    "suggestedDurationDays": number',
    '  },',
    '  "keyResults": [',
    '    {',
    '      "title": string,',
    '      "description": string,',
    '      "valueType": "Incremental" | "Absolute" | "Percentage" | "Binary",',
    '      "calculationMethod": "Sum" | "Average" | "Max" | "Min" | "Last",',
    '      "startValue": number,',
    '      "currentValue": number,',
    '      "targetValue": number,',
    '      "unit": string,',
    '      "weight": 1 | 2 | 3 | 4 | 5',
    '    }',
    '  ]',
    '}',
    'Rules for key results:',
    '- Use Binary only for done/not-done milestones with targetValue 1.',
    '- Use Incremental + Sum for accumulation goals such as points, counts, pages, or hours.',
    '- Use Absolute + Last for state-based goals.',
    '- Keep weight between 1 and 5.',
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

// Residual 1099 keep-boundary: plain-object or null (never empty {}).
// Intentionally not data-portability schedule.importer asRecord ({} fallback) or toRecord (undefined).
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

// Residual 1105 keep-boundary: LLM JSON may stringify numbers → Number(string) allowed.
// Soft residual 1105: chat-execution adapter toNumber is number-only for provider usage tokens.
function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

// Residual 1101 keep-boundary: positive finite number or Date.parse string → number|undefined.
// Soft residual 1101: data-portability projection toTimestamp (any number/Date) + notification null (no force-merge).
function toTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return undefined;
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

function toValueType(value: unknown): KeyResultPreview['valueType'] {
  switch (value) {
    case KeyResultValueType.Incremental:
    case KeyResultValueType.Absolute:
    case KeyResultValueType.Percentage:
    case KeyResultValueType.Binary:
      return value;
    default:
      return KeyResultValueType.Incremental;
  }
}

function toCalculationMethod(
  value: unknown,
  valueType: KeyResultPreview['valueType'],
): KeyResultPreview['calculationMethod'] {
  switch (value) {
    case KeyResultCalculationMethod.Sum:
    case KeyResultCalculationMethod.Average:
    case KeyResultCalculationMethod.Max:
    case KeyResultCalculationMethod.Min:
    case KeyResultCalculationMethod.Last:
      return value;
    default:
      return valueType === KeyResultValueType.Incremental
        ? KeyResultCalculationMethod.Sum
        : KeyResultCalculationMethod.Last;
  }
}

function toKeyResults(value: unknown): KeyResultPreview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const valueType = toValueType(item.valueType);
      const startValue = toNumber(item.startValue) ?? 0;
      const currentValue = toNumber(item.currentValue) ?? startValue;
      const targetValue =
        valueType === KeyResultValueType.Binary ? 1 : (toNumber(item.targetValue) ?? 1);

      return {
        title: toNonEmptyString(item.title) ?? 'Review generated draft',
        description: toOptionalString(item.description),
        valueType,
        calculationMethod: toCalculationMethod(item.calculationMethod, valueType),
        startValue,
        currentValue,
        targetValue,
        unit:
          valueType === KeyResultValueType.Binary
            ? toNonEmptyString(item.unit) ?? 'done'
            : toNonEmptyString(item.unit) ?? 'step',
        weight: toPositiveInteger(item.weight) && (toPositiveInteger(item.weight) as number) <= 5
          ? (toPositiveInteger(item.weight) as number)
          : 1,
      };
    });
}
