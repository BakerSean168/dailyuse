import { randomUUID } from 'node:crypto';

import {
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  signInternalRequest,
} from './internal-ai-service-request-signer';

export interface AIServiceInternalClientOptions {
  baseUrl: string;
  serviceSecret: string;
  serviceName: string;
  timeoutMs?: number;
}

export interface AIServiceInternalRequestOptions<TBody> {
  path: string;
  identityId: string;
  body: TBody;
  requestId?: string;
}

export class AIServiceInternalRequestError extends Error {
  constructor(
    message: string,
    readonly requestId: string,
    readonly category: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AIServiceInternalRequestError';
  }
}

export class AIServiceInternalClient {
  private readonly timeoutMs: number;

  constructor(private readonly options: AIServiceInternalClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  async postJson<TResponse, TBody>(
    request: AIServiceInternalRequestOptions<TBody>,
  ): Promise<TResponse> {
    const response = await this.post(request);
    return (await response.json()) as TResponse;
  }

  async postStream<TBody>(
    request: AIServiceInternalRequestOptions<TBody>,
  ): Promise<Response> {
    return this.post(request);
  }

  private async post<TBody>(
    request: AIServiceInternalRequestOptions<TBody>,
  ): Promise<Response> {
    const requestId = request.requestId ?? randomUUID();
    const body = JSON.stringify(request.body);
    const timestamp = Math.floor(Date.now() / 1000);
    const signing = signInternalRequest({
      serviceName: this.options.serviceName,
      method: 'POST',
      path: request.path,
      timestamp,
      body,
      secret: this.options.serviceSecret,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(new URL(request.path, this.options.baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_SERVICE_HEADER]: this.options.serviceName,
          [INTERNAL_TIMESTAMP_HEADER]: String(signing.timestamp),
          [INTERNAL_CONTENT_HASH_HEADER]: signing.contentSha256,
          [INTERNAL_SIGNATURE_HEADER]: signing.signature,
          'X-Request-Id': requestId,
          'X-Identity-Id': request.identityId,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        const detail = responseText.trim() || 'empty response body';
        const category =
          response.status === 401
            ? 'unauthorized'
            : response.status === 408 || response.status === 504
              ? 'timeout'
              : response.status >= 500
                ? 'upstream_provider_error'
                : 'transport';
        throw new AIServiceInternalRequestError(
          `ai-service request failed (${response.status}) [requestId: ${requestId}] ${detail}`,
          requestId,
          category,
          response.status,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceInternalRequestError(
          `ai-service request timed out [requestId: ${requestId}]`,
          requestId,
          'timeout',
        );
      }
      if (error instanceof AIServiceInternalRequestError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AIServiceInternalRequestError(
          `${error.message} [requestId: ${requestId}]`,
          requestId,
          'transport',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
