/**
 * Trace runtime initializer (RefArch Phase 6).
 * Trace runtime 初始化器（RefArch 阶段 6）。
 *
 * Bridges env-based opt-in configuration to the `HttpRequestTrace` Port. With
 * `OTEL_TRACING_ENABLED=0` (default) it returns the shared noop trace and a
 * no-op shutdown — zero collector dependency. With `=1` it starts the Node SDK
 * with an OTLP HTTP exporter; incomplete configuration is rejected by the env
 * schema at startup (fail fast, never "enabled but silently unexported").
 *
 * 将基于 env 的 opt-in 配置桥接到 `HttpRequestTrace` Port。`OTEL_TRACING_ENABLED=0`
 * （默认）时返回共享 noop trace 与 no-op shutdown——零 collector 依赖。为 `=1`
 * 时启动带 OTLP HTTP exporter 的 Node SDK；配置不完整会在启动阶段被 env
 * schema 拒绝（fail fast，绝不"已启用但静默无 exporter"）。
 */

import { createLogger, type ILogger } from '@memoflow/utils/logger';
import { env } from '../config/env.js';
import { NOOP_HTTP_REQUEST_TRACE } from './noop-http-request-trace';
import { OpenTelemetryHttpRequestTrace } from './opentelemetry-http-request-trace';
import type { HttpRequestTrace } from './http-request-trace';

/** Service name reported to the OTLP endpoint. 上报给 OTLP endpoint 的服务名。 */
const DEFAULT_OTEL_SERVICE_NAME = 'memoflow-api';

/**
 * Handle for the initialized trace runtime.
 * 已初始化 trace runtime 的句柄。
 */
export interface TraceRuntime {
  /** Trace Port to inject into the request middleware. 注入请求 middleware 的 trace Port。 */
  readonly trace: HttpRequestTrace;
  /** Flushes and shuts down the trace provider (no-op when disabled). */
  shutdown(): Promise<void>;
}

/** Lazily created logger — never at module scope, so importing this module
 *  cannot create a logger before the preflight provider is registered.
 *  惰性创建 logger——绝不在模块作用域创建，因此导入本模块不会在 preflight
 *  provider 注册前创建 logger。 */
function traceLogger(): ILogger {
  return createLogger('TraceRuntime');
}

/**
 * Initializes the trace runtime according to `OTEL_TRACING_ENABLED`.
 * 根据 `OTEL_TRACING_ENABLED` 初始化 trace runtime。
 *
 * Must be awaited after `initializeLogger()` in the preflight entry and before
 * the server graph is imported, so the SDK is registered before any span is
 * created.
 *
 * 必须在 preflight 入口中 `initializeLogger()` 之后、导入 server 依赖图之前
 * await，确保 SDK 在任何 span 创建前已注册。
 *
 * @returns A `TraceRuntime` handle with the trace Port and shutdown hook.
 */
export async function initializeTraceRuntime(): Promise<TraceRuntime> {
  if (env.OTEL_TRACING_ENABLED !== '1') {
    return {
      trace: NOOP_HTTP_REQUEST_TRACE,
      shutdown: async () => undefined,
    };
  }

  // Env schema already fail-fasts when the endpoint/service name are missing.
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName = env.OTEL_SERVICE_NAME ?? DEFAULT_OTEL_SERVICE_NAME;
  // Load the OTel SDK only when tracing is enabled so a disabled runtime never
  // imports @opentelemetry/sdk-node / exporter-trace-otlp-http.
  // 仅在启用 tracing 时加载 OTel SDK，禁用时绝不 import
  // @opentelemetry/sdk-node / exporter-trace-otlp-http。
  const [{ NodeSDK }, { OTLPTraceExporter }] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
  ]);
  const exporter = new OTLPTraceExporter({ url: endpoint });
  // NodeSDK wires a batch span processor around the exporter, so shutdown
  // force-flushes pending spans.
  const sdk = new NodeSDK({
    serviceName,
    traceExporter: exporter,
  });

  await sdk.start();
  traceLogger().info('OpenTelemetry tracing enabled', { endpoint, serviceName });

  return {
    trace: new OpenTelemetryHttpRequestTrace(),
    shutdown: async () => {
      try {
        await sdk.shutdown();
        traceLogger().info('OpenTelemetry tracing shut down');
      } catch (error) {
        traceLogger().error('OpenTelemetry tracing shutdown failed', error);
      }
    },
  };
}
