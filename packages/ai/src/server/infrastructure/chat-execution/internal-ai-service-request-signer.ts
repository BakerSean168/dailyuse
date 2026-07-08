import { createHash, createHmac } from 'node:crypto';

/**
 * Header names shared with the Python ai-service.
 *
 * Keeping the constants here avoids accidental typos and makes the transport
 * contract explicit in one place on the TypeScript side.
 */
export const INTERNAL_SERVICE_HEADER = 'X-Internal-Service';
export const INTERNAL_TIMESTAMP_HEADER = 'X-Internal-Timestamp';
export const INTERNAL_CONTENT_HASH_HEADER = 'X-Internal-Content-SHA256';
export const INTERNAL_SIGNATURE_HEADER = 'X-Internal-Signature';

export interface InternalRequestSigningInput {
  serviceName: string;
  method: string;
  path: string;
  timestamp: number;
  body: string;
  secret: string;
}

export function computeContentSha256(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

export function buildInternalSignaturePayload(input: {
  serviceName: string;
  method: string;
  path: string;
  timestamp: number;
  contentSha256: string;
}): string {
  return [
    input.serviceName,
    input.method.toUpperCase(),
    input.path,
    String(input.timestamp),
    input.contentSha256,
  ].join('\n');
}

export function signInternalRequest(input: InternalRequestSigningInput): {
  timestamp: number;
  contentSha256: string;
  signature: string;
} {
  const contentSha256 = computeContentSha256(input.body);
  const payload = buildInternalSignaturePayload({
    serviceName: input.serviceName,
    method: input.method,
    path: input.path,
    timestamp: input.timestamp,
    contentSha256,
  });

  const signature = createHmac('sha256', input.secret).update(payload, 'utf8').digest('hex');

  return {
    timestamp: input.timestamp,
    contentSha256,
    signature,
  };
}
