import { isAIExecutionError } from './ai-execution-error';

export function isAbortLikeError(error: unknown): boolean {
  if (isAIExecutionError(error)) return error.category === 'aborted';
  if (!error || typeof error !== 'object') return false;
  if ('category' in error && (error as { category?: unknown }).category === 'aborted') return true;
  return 'name' in error && (error as { name?: unknown }).name === 'AbortError';
}
