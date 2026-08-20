import { previewText } from '../../../shared/preview-text';

const REDACTED = '[REDACTED]';
const UNPARSEABLE_BODY = '[unavailable non-json body]';

const SENSITIVE_KEYS = new Set([
  'apikey',
  'authorization',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'servicesecret',
  'password',
  'credential',
  'credentials',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.has(normalized) || normalized.endsWith('apikey');
}

function collectSecretValues(value: unknown, target: Set<string>): void {
  if (typeof value === 'string' && value.length > 0) {
    target.add(value);
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    target.add(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSecretValues(item, target);
    return;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectSecretValues(nested, target);
    }
  }
}

function redactJsonValue(value: unknown, secretValues: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactJsonValue(item, secretValues));
  }
  if (!value || typeof value !== 'object') return value;

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      collectSecretValues(nested, secretValues);
      output[key] = REDACTED;
    } else {
      output[key] = redactJsonValue(nested, secretValues);
    }
  }
  return output;
}

export interface RedactedAIServiceRequestLogContext {
  readonly bodyPreview: string;
  readonly redactText: (value: string) => string;
}

/**
 * Build a log-only redacted projection of an ai-service request body.
 * The caller must continue signing/sending the original body unchanged.
 */
export function createRedactedAIServiceRequestLogContext(
  body: string,
): RedactedAIServiceRequestLogContext {
  if (!body) {
    return { bodyPreview: '', redactText: (value) => value };
  }

  const secretValues = new Set<string>();
  let bodyPreview: string;
  try {
    const parsed = JSON.parse(body) as unknown;
    bodyPreview = previewText(JSON.stringify(redactJsonValue(parsed, secretValues))) ?? '';
  } catch {
    // A request body reaching this client should normally be JSON. If it is not,
    // fail closed for logging rather than printing arbitrary raw content.
    bodyPreview = UNPARSEABLE_BODY;
  }

  const orderedSecrets = [...secretValues]
    .filter((value) => value.length > 0)
    .sort((left, right) => right.length - left.length);

  return {
    bodyPreview,
    redactText(value: string): string {
      let redacted = value;
      for (const secret of orderedSecrets) {
        redacted = redacted.split(secret).join(REDACTED);
      }
      return redacted;
    },
  };
}
