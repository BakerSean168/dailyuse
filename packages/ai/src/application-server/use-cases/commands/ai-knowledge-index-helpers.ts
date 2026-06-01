import { createHash } from 'node:crypto';
import type {
  IAIExecutionLogPort,
  KnowledgeSourceResource,
  KnowledgeIndexedResource,
} from '../../ports';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('AIKnowledgeIndexHelpers');

export interface SyncKnowledgeResourcesOptions {
  force?: boolean;
  requestId?: string;
  providerConfig?: import('../../ports').ChatExecutionProviderConfig;
}

export interface SyncKnowledgeResourcesResult {
  indexedResources: KnowledgeIndexedResource[];
  indexedCount: number;
  reusedCount: number;
  failedCount: number;
  results: Array<{
    resourceId: string;
    resourcePath: string;
    status: 'indexed' | 'reused' | 'failed';
    error?: string;
  }>;
}

export interface SyncKnowledgeResourceByIdResult {
  resource: KnowledgeSourceResource | null;
  sync: SyncKnowledgeResourcesResult | null;
}

export function mergeUniqueResources(
  resources: KnowledgeSourceResource[],
): KnowledgeSourceResource[] {
  const seen = new Set<string>();
  const merged: KnowledgeSourceResource[] = [];

  for (const resource of resources) {
    if (seen.has(resource.resourceId)) {
      continue;
    }
    seen.add(resource.resourceId);
    merged.push(resource);
  }

  return merged;
}

export function resolveSourceContentHash(resource: KnowledgeSourceResource): string {
  const metadataHash = resource.metadata?.['contentDigest'];
  if (typeof metadataHash === 'string' && metadataHash.length > 0) {
    return metadataHash;
  }

  return createHash('sha256').update(resource.content).digest('hex');
}

export async function recordExecution(
  executionLogPort: IAIExecutionLogPort | undefined,
  input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
): Promise<void> {
  if (!executionLogPort) {
    return;
  }

  try {
    await executionLogPort.record(input);
  } catch (error) {
    logger.warn('Failed to record knowledge indexing execution log', {
      error,
      taskType: input.taskType,
    });
  }
}
