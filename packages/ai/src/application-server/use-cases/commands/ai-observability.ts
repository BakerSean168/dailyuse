import { randomUUID } from 'node:crypto';

import type { AIExecutionLogInput, AICostEstimate, ChatExecutionUsage } from '../../ports';

type AIErrorWithMetadata = Error & {
  category?: string;
  requestId?: string;
  statusCode?: number;
};

interface AIPricingRule {
  pricingModel: string;
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
  matches(model: string): boolean;
}

const AI_COST_PRICING_VERSION = 'static-catalog-2026-03';
const AI_PRICING_RULES: readonly AIPricingRule[] = [
  {
    pricingModel: 'gpt-4o-mini',
    inputPerMillionUsd: 0.15,
    outputPerMillionUsd: 0.6,
    matches: (model) => model === 'gpt-4o-mini' || model.startsWith('gpt-4o-mini-'),
  },
  {
    pricingModel: 'gpt-4o',
    inputPerMillionUsd: 2.5,
    outputPerMillionUsd: 10,
    matches: (model) => model === 'gpt-4o' || model.startsWith('gpt-4o-'),
  },
  {
    pricingModel: 'deepseek-chat',
    inputPerMillionUsd: 0.27,
    outputPerMillionUsd: 1.1,
    matches: (model) => model === 'deepseek-chat' || model.startsWith('deepseek-chat-'),
  },
  {
    pricingModel: 'free-tier-model',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    matches: (model) => model.includes(':free'),
  },
];

export function createAIRequestId(): string {
  return randomUUID();
}

export function classifyAIExecutionError(error: unknown): string {
  const candidate = error as AIErrorWithMetadata | undefined;
  if (candidate?.category) {
    return candidate.category;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('timed out') || message.includes('timeout')) {
    return 'timeout';
  }
  if (message.includes('unauthorized') || message.includes('invalid signature')) {
    return 'unauthorized';
  }
  if (message.includes('structured output')) {
    return 'structured_output';
  }
  if (message.includes('not found')) {
    return 'not_found';
  }
  if (message.includes('validation')) {
    return 'validation';
  }
  if (message.includes('upstream')) {
    return 'upstream_provider_error';
  }
  if (message.includes('request failed') || message.includes('fetch')) {
    return 'transport';
  }

  return 'unknown';
}

export function attachRequestIdToError(error: unknown, requestId: string): Error {
  if (error instanceof Error) {
    if (error.message.includes(requestId)) {
      return error;
    }

    const enriched = new Error(`${error.message} [requestId: ${requestId}]`);
    Object.assign(enriched, error, { requestId });
    return enriched;
  }

  const fallback = new Error(`AI execution failed [requestId: ${requestId}]`);
  Object.assign(fallback, { requestId });
  return fallback;
}

export function withAICostEstimate(input: AIExecutionLogInput): AIExecutionLogInput {
  if (input.costEstimate || !input.model || !input.tokenUsage) {
    return input;
  }

  const costEstimate = estimateAIExecutionCost(input.model, input.tokenUsage);
  if (!costEstimate) {
    return input;
  }

  return {
    ...input,
    costEstimate,
  };
}

function estimateAIExecutionCost(
  model: string,
  tokenUsage: ChatExecutionUsage,
): AICostEstimate | undefined {
  const normalizedModel = model.trim().toLowerCase();
  if (!normalizedModel) {
    return undefined;
  }

  const pricingRule = AI_PRICING_RULES.find((rule) => rule.matches(normalizedModel));
  if (!pricingRule) {
    return undefined;
  }

  const promptCostUsd =
    ((tokenUsage.promptTokens ?? 0) / 1_000_000) * pricingRule.inputPerMillionUsd;
  const completionCostUsd =
    ((tokenUsage.completionTokens ?? 0) / 1_000_000) * pricingRule.outputPerMillionUsd;

  return {
    promptCostUsd: roundUsd(promptCostUsd),
    completionCostUsd: roundUsd(completionCostUsd),
    totalCostUsd: roundUsd(promptCostUsd + completionCostUsd),
    pricingVersion: AI_COST_PRICING_VERSION,
    pricingModel: pricingRule.pricingModel,
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 100_000_000) / 100_000_000;
}
