import { randomUUID } from 'node:crypto';
import { createLogger } from '@dailyuse/utils/logger';

import {
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  signInternalRequest,
} from './internal-ai-service-request-signer';

const logger = createLogger('AIServiceInternalClient');

function previewText(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

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
  signal?: AbortSignal;
}

export interface AIServiceInternalGetRequestOptions {
  path: string;
  identityId: string;
  requestId?: string;
  signal?: AbortSignal;
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

  async getJson<TResponse>(
    request: AIServiceInternalGetRequestOptions,
  ): Promise<TResponse> {
    const response = await this.request({
      ...request,
      method: 'GET',
      body: '',
    });
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
    return this.request({
      ...request,
      method: 'POST',
      body: JSON.stringify(request.body),
    });
  }

  private async request(request: {
    method: 'GET' | 'POST';
    path: string;
    identityId: string;
    requestId?: string;
    body: string;
    signal?: AbortSignal;
  }): Promise<Response> {
    const requestId = request.requestId ?? randomUUID();
    const timestamp = Math.floor(Date.now() / 1000);
    const requestUrl = new URL(request.path, this.options.baseUrl);
    const signing = signInternalRequest({
      serviceName: this.options.serviceName,
      method: request.method,
      path: requestUrl.pathname,
      timestamp,
      body: request.body,
      secret: this.options.serviceSecret,
    });

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), this.timeoutMs);
    const { signal, cleanup } = composeAbortSignal(request.signal, timeoutController.signal);

    try {
      logger.info('ai-service internal request started', {
        requestId,
        path: request.path,
        identityId: request.identityId,
        baseUrl: this.options.baseUrl,
        timeoutMs: this.timeoutMs,
        bodyPreview: previewText(request.body),
      });
      const response = await fetch(requestUrl.toString(), {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_SERVICE_HEADER]: this.options.serviceName,
          [INTERNAL_TIMESTAMP_HEADER]: String(signing.timestamp),
          [INTERNAL_CONTENT_HASH_HEADER]: signing.contentSha256,
          [INTERNAL_SIGNATURE_HEADER]: signing.signature,
          'X-Request-Id': requestId,
          'X-Identity-Id': request.identityId,
        },
        body: request.method === 'POST' ? request.body : undefined,
        signal,
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
        logger.warn('ai-service internal request failed with non-2xx response', {
          requestId,
          path: request.path,
          identityId: request.identityId,
          statusCode: response.status,
          category,
          detail: previewText(detail),
        });
        throw new AIServiceInternalRequestError(
          `ai-service request failed (${response.status}) [requestId: ${requestId}] ${detail}`,
          requestId,
          category,
          response.status,
        );
      }

      logger.info('ai-service internal request completed', {
        requestId,
        path: request.path,
        identityId: request.identityId,
        statusCode: response.status,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const category = request.signal?.aborted ? 'aborted' : 'timeout';
        const message =
          category === 'aborted'
            ? `ai-service request aborted by caller [requestId: ${requestId}]`
            : `ai-service request timed out [requestId: ${requestId}]`;
        logger.warn('ai-service internal request aborted or timed out', {
          requestId,
          path: request.path,
          identityId: request.identityId,
          category,
        });
        throw new AIServiceInternalRequestError(
          message,
          requestId,
          category,
        );
      }
      if (error instanceof AIServiceInternalRequestError) {
        logger.warn('ai-service internal request raised structured request error', {
          requestId,
          path: request.path,
          identityId: request.identityId,
          category: error.category,
          statusCode: error.statusCode,
          message: error.message,
        });
        throw error;
      }
      if (error instanceof Error) {
        logger.warn('ai-service internal request transport error', {
          requestId,
          path: request.path,
          identityId: request.identityId,
          message: error.message,
        });
        throw new AIServiceInternalRequestError(
          `${error.message} [requestId: ${requestId}]`,
          requestId,
          'transport',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      cleanup();
    }
  }
}

function composeAbortSignal(
  externalSignal: AbortSignal | undefined,
  timeoutSignal: AbortSignal,
): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  if (!externalSignal) {
    return {
      signal: timeoutSignal,
      cleanup: () => undefined,
    };
  }

  if (externalSignal.aborted || timeoutSignal.aborted) {
    const abortedController = new AbortController();
    abortedController.abort();
    return {
      signal: abortedController.signal,
      cleanup: () => undefined,
    };
  }

  const combinedController = new AbortController();
  const abortCombinedSignal = () => {
    if (!combinedController.signal.aborted) {
      combinedController.abort();
    }
  };

  externalSignal.addEventListener('abort', abortCombinedSignal);
  timeoutSignal.addEventListener('abort', abortCombinedSignal);

  return {
    signal: combinedController.signal,
    cleanup: () => {
      externalSignal.removeEventListener('abort', abortCombinedSignal);
      timeoutSignal.removeEventListener('abort', abortCombinedSignal);
    },
  };
}
