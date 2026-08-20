import { Router, type Request, type RequestHandler, type Response } from 'express';
import {
  AssistantRuntimeClientCommandSchema,
  AssistantRuntimeEventSchema,
  AIWorkflowCancelClientRequestSchema,
  AIWorkflowGetClientRequestSchema,
  AIWorkflowListClientRequestSchema,
  AIWorkflowResumeClientRequestSchema,
  AIWorkflowRunViewSchema,
  AIWorkflowStartClientRequestSchema,
  type AssistantRuntimeEvent,
} from '@memoflow/contracts/ai';
import { createHttpResponseBuilder, formatZodErrors } from '@memoflow/utils/result';
import type { AIWorkflowRuntimePort, MastraAIRuntime } from '../../server/mastra/runtime';
import { readAiExpressEnvelopeMeta } from '../../shared/express-execution-context';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
}

type AssistantRuntimePort = Pick<MastraAIRuntime, 'dispatchMessage' | 'cancelRun'>;

function authenticatedIdentity(req: Request): string | undefined {
  return (req as Request & { user?: { identityId?: string } }).user?.identityId;
}

function writeRuntimeSse(res: Response, event: 'runtime' | 'error', data: unknown): boolean {
  if (res.writableEnded) return false;
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Canonical AI vNext Assistant transport.
 *
 * The route owns HTTP framing only. Mastra owns run/thread state; the host owns
 * authenticated identity. No Mastra private event is serialized across the
 * product boundary.
 */
export function registerAIRuntimeRoutes(
  runtime: AssistantRuntimePort | null,
  middleware: PlatformMiddleware,
  workflowRuntime: AIWorkflowRuntimePort | null = null,
): Router {
  const router = Router();
  const { auth } = middleware;

  router.post('/assistant/sse', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!runtime) {
      res.status(503).json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI runtime unavailable'));
      return;
    }

    const parsed = AssistantRuntimeClientCommandSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.type !== 'message') {
      const details = parsed.success
        ? [{ field: 'type', code: 'INVALID_FIELD', message: 'Expected message command' }]
        : formatZodErrors(parsed.error.issues);
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();
    let connectionClosed = false;
    const close = () => {
      connectionClosed = true;
      abortController.abort();
    };
    req.on('aborted', close);
    res.on('close', close);

    try {
      for await (const event of runtime.dispatchMessage({
        identityId,
        conversationId: parsed.data.conversationId,
        content: parsed.data.content,
        providerId: parsed.data.providerId,
        modelId: parsed.data.modelId,
        locale: parsed.data.locale,
        signal: abortController.signal,
      })) {
        if (connectionClosed || res.writableEnded) break;
        const validated: AssistantRuntimeEvent = AssistantRuntimeEventSchema.parse(event);
        if (!writeRuntimeSse(res, 'runtime', validated)) {
          close();
          break;
        }
      }
    } catch {
      if (!connectionClosed && !abortController.signal.aborted) {
        writeRuntimeSse(res, 'error', {
          code: 'AI_RUNTIME_TRANSPORT_ERROR',
          message: 'AI runtime request failed',
        });
      }
    } finally {
      req.removeListener('aborted', close);
      res.removeListener('close', close);
      if (!res.writableEnded) res.end();
    }
  });

  router.post('/assistant/cancel', auth, (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!runtime) {
      res.status(503).json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI runtime unavailable'));
      return;
    }

    const parsed = AssistantRuntimeClientCommandSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.type !== 'cancel_run') {
      const details = parsed.success
        ? [{ field: 'type', code: 'INVALID_FIELD', message: 'Expected cancel_run command' }]
        : formatZodErrors(parsed.error.issues);
      res.status(400).json(responseBuilder.validationError(details));
      return;
    }

    const cancelled = runtime.cancelRun({ identityId, runId: parsed.data.runId });
    res.status(200).json(responseBuilder.success({ cancelled }));
  });

  router.post('/workflow/start', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!workflowRuntime) {
      res
        .status(503)
        .json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI workflow runtime unavailable'));
      return;
    }
    const parsed = AIWorkflowStartClientRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(responseBuilder.validationError(formatZodErrors(parsed.error.issues)));
      return;
    }
    try {
      const run = AIWorkflowRunViewSchema.parse(
        await workflowRuntime.start({ identityId, request: parsed.data }),
      );
      res.status(200).json(responseBuilder.success(run));
    } catch {
      res.status(500).json(responseBuilder.error('AI_WORKFLOW_RUNTIME_ERROR', 'Workflow failed'));
    }
  });

  router.post('/workflow/resume', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!workflowRuntime) {
      res
        .status(503)
        .json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI workflow runtime unavailable'));
      return;
    }
    const parsed = AIWorkflowResumeClientRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(responseBuilder.validationError(formatZodErrors(parsed.error.issues)));
      return;
    }
    try {
      const run = AIWorkflowRunViewSchema.parse(
        await workflowRuntime.resume({ identityId, request: parsed.data }),
      );
      res.status(200).json(responseBuilder.success(run));
    } catch {
      res.status(500).json(responseBuilder.error('AI_WORKFLOW_RUNTIME_ERROR', 'Workflow failed'));
    }
  });

  router.post('/workflow/get', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!workflowRuntime) {
      res
        .status(503)
        .json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI workflow runtime unavailable'));
      return;
    }
    const parsed = AIWorkflowGetClientRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(responseBuilder.validationError(formatZodErrors(parsed.error.issues)));
      return;
    }
    try {
      const run = await workflowRuntime.get({ identityId, runId: parsed.data.runId });
      res
        .status(200)
        .json(responseBuilder.success(run ? AIWorkflowRunViewSchema.parse(run) : null));
    } catch {
      res.status(500).json(responseBuilder.error('AI_WORKFLOW_RUNTIME_ERROR', 'Workflow failed'));
    }
  });

  router.post('/workflow/list', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!workflowRuntime) {
      res
        .status(503)
        .json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI workflow runtime unavailable'));
      return;
    }
    const parsed = AIWorkflowListClientRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(responseBuilder.validationError(formatZodErrors(parsed.error.issues)));
      return;
    }
    try {
      const runs = await workflowRuntime.list({
        identityId,
        conversationId: parsed.data.conversationId,
      });
      res
        .status(200)
        .json(responseBuilder.success(runs.map((run) => AIWorkflowRunViewSchema.parse(run))));
    } catch {
      res.status(500).json(responseBuilder.error('AI_WORKFLOW_RUNTIME_ERROR', 'Workflow failed'));
    }
  });

  router.post('/workflow/cancel', auth, async (req, res) => {
    const responseBuilder = createHttpResponseBuilder(readAiExpressEnvelopeMeta(req));
    const identityId = authenticatedIdentity(req);
    if (!identityId) {
      res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
      return;
    }
    if (!workflowRuntime) {
      res
        .status(503)
        .json(responseBuilder.error('SERVICE_UNAVAILABLE', 'AI workflow runtime unavailable'));
      return;
    }
    const parsed = AIWorkflowCancelClientRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(responseBuilder.validationError(formatZodErrors(parsed.error.issues)));
      return;
    }
    try {
      const run = await workflowRuntime.cancel({ identityId, runId: parsed.data.runId });
      res
        .status(200)
        .json(responseBuilder.success(run ? AIWorkflowRunViewSchema.parse(run) : null));
    } catch {
      res.status(500).json(responseBuilder.error('AI_WORKFLOW_RUNTIME_ERROR', 'Workflow failed'));
    }
  });

  return router;
}
