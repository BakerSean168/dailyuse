import { translateResultError } from '../../../shared/utils/translate-result-error';

export function getAIErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
) {
  return translateResultError(error, t, { fallbackKey });
}
