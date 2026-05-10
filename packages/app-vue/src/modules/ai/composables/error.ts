import { translateResultError } from '../../../shared/utils/translateResultError';

export function getAIErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
) {
  return translateResultError(error, t, { fallbackKey });
}
