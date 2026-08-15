/**
 * AI Electron Transport Module Factory
 * AI Electron 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `AIModuleInstance` onto Electron's
 * `ipcMain` and owns that instance's start/dispose lifecycle. It also owns the
 * AI stream/session bookkeeping (AbortController per stream, per-sender
 * cancellation) and channel cleanup.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `AIModuleInstance` 挂到 Electron 的 `ipcMain` 上，
 * 并托管该实例的 start/dispose 生命周期。它还负责 AI 流/会话簿记
 * （每个流的 AbortController、按发送方取消）与通道清理。
 *
 * The host (apps/desktop) is responsible for composition: it selects the
 * PowerSync adapters, builds the repository set, the service runtime adapters
 * (chat execution, knowledge ingestion/query, analytics, agent runtime,
 * evaluation report, host knowledge/analytics ports) and the runtime
 * contributions, calls `createAIModule(...)`, and passes the resulting instance
 * in through `AIElectronModuleOptions`. This factory never reads `ctx.db`,
 * never constructs repositories/adapters, and never starts a runtime adapter.
 *
 * 宿主（apps/desktop）负责组合：选择 PowerSync 适配器、构建 repository set、
 * 服务 runtime 适配器（chat execution、knowledge ingestion/query、analytics、
 * agent runtime、evaluation report、宿主 knowledge/analytics ports）与 runtime
 * contribution、调用 `createAIModule(...)`，再把组装结果通过
 * `AIElectronModuleOptions` 传入。本工厂不读取 `ctx.db`，不创建
 * repository/adapter，也不启动任何 runtime adapter。
 *
 * `instance.api` is the HTTP/IPC-shared application seam
 * (`AIApplicationPort`). Stream/session handling stays in this transport file
 * because it is Electron-specific (sender-scoped cancellation and push).
 *
 * `instance.api` 是 HTTP/IPC 共用的应用 seam（`AIApplicationPort`）。
 * 流/会话处理保留在本传输文件中，因为它是 Electron 特有的（按发送方取消与
 * 推送）。
 *
 * Per-handle state machine (`created -> registered | failed`, then any state
 * -> `disposed`):
 * - register(): only allowed from `created`. Registers all AI IPC handlers,
 *   then calls `instance.start()` — channel registration happens BEFORE start,
 *   so a handler-build failure leaves no runtime side effects. On success the
 *   handle moves to `registered`; a second register() throws. On any failure it
 *   reverses exactly the channels installed by THIS call, best-effort disposes
 *   the instance (logged if dispose itself throws), moves to `failed`, and
 *   rethrows the ORIGINAL error. A failed handle must not be re-registered.
 * - destroy(): always allowed and always idempotent. A handle in `failed` is a
 *   terminal no-op too. For a live handle it first removes all AI channels and
 *   aborts this handle's active stream sessions, then sets the state to
 *   `disposed` BEFORE `instance.dispose()` runs, so a reentrant/retry destroy
 *   stays a no-op even if dispose throws (destroy may propagate that error).
 *
 * 每个 handle 的状态机（`created -> registered | failed`，之后任意状态 ->
 * `disposed`）：
 * - register()：仅允许从 `created` 进入。注册全部 AI IPC handler，然后调用
 *   `instance.start()`——handler 先于 start 注册，因此 handler 注册失败不会
 *   留下任何 runtime 副作用。成功则进入 `registered`，重复 register() 抛错；
 *   任何失败会逆向移除本次调用已安装的通道、best-effort dispose 实例（若
 *   dispose 自身抛错则记录日志）、进入 `failed` 并重新抛出原始错误。
 *   failed 的 handle 不得再次注册。
 * - destroy()：任何状态都允许，且始终幂等。处于 `failed` 的 handle 也是
 *   终态 no-op。对存活 handle，先移除全部 AI 通道并中止本 handle 的活动流
 *   会话，再把状态置为 `disposed` 之后再调用 `instance.dispose()`，因此即使
 *   dispose 抛错（该错误可向外传播），重入/重试 destroy 仍为 no-op。
 */

import { ipcMain } from 'electron';
import {
  AIChannels,
  AIStreamChannels,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import { AssistantClientCommandSchema } from '@memoflow/contracts/ai';
import { fail, ok } from '@memoflow/contracts/result';
import { formatZodErrors } from '@memoflow/utils/result';
import { createLogger } from '@memoflow/utils/logger';
import type { AIModuleInstance } from '../server/infrastructure';
import { withAuthenticatedValue } from './authenticated-ipc';
import { toHostCommand } from '../server/transport/ai-assistant-facade.controller';

const logger = createLogger('AIElectron');

const allChannels = Object.values(AIChannels);

type StreamSession = {
  abortController: AbortController;
  webContentsId: number;
};

/**
 * Per-handle lifecycle state. Only 'created' may enter 'registered' (or
 * 'failed' on a registration error); any state may end in 'disposed'.
 *
 * 每个 handle 的生命周期状态。只有 'created' 可以进入 'registered'
 * （或注册失败时进入 'failed'）；任意状态都可以结束于 'disposed'。
 */
type ModuleHandleState = 'created' | 'registered' | 'disposed' | 'failed';

/**
 * AI Electron module handle.
 * AI Electron 模块 handle。
 *
 * Structurally compatible with `IElectronModule` from
 * `@memoflow/contracts/electron`, but defined locally so this seam stays
 * host-shaped: the factory returns it already bound to one instance.
 *
 * 与 `@memoflow/contracts/electron` 的 `IElectronModule` 结构兼容，
 * 但在本地定义，使该 seam 保持宿主形状：工厂返回时已绑定到单个实例。
 */
export interface AIElectronModuleDef {
  readonly name: string;
  register(context: IElectronModuleContext): void;
  destroy?(): void;
}

/**
 * Options carrying the already-assembled AI instance.
 * 携带已装配 AI 实例的选项。
 */
export interface AIElectronModuleOptions {
  readonly instance: AIModuleInstance;
}

/**
 * Creates the AI Electron transport module handle.
 * 创建 AI Electron 传输模块 handle。
 *
 * Turns an already-assembled `AIModuleInstance` into an `IElectronModule`-
 * compatible handle. The handle is a transport adapter, not a composition root:
 * it only registers IPC channels, owns start/dispose lifecycle and manages
 * stream sessions. IPC channel names, payload schemas, controller methods and
 * response envelopes are unchanged — see the handler registrations below.
 *
 * 把已装配的 `AIModuleInstance` 变成兼容 `IElectronModule` 的 handle。
 * 该 handle 是传输适配器而非组合根：只注册 IPC 通道、托管 start/dispose
 * 生命周期并管理流会话。IPC 通道名、payload schema、controller 方法与响应
 * 信封均保持不变——见下方各 handler 注册。
 *
 * @param options - Options carrying the assembled AI instance.
 * @returns An IElectronModule-compatible handle bound to the instance.
 */
export function createAIElectronModule(options: AIElectronModuleOptions): AIElectronModuleDef {
  if (!options?.instance) {
    throw new Error('[FAIL-CLOSED] createAIElectronModule requires options.instance');
  }
  let state: ModuleHandleState = 'created';
  const activeStreamSessions = new Map<string, StreamSession>();

  return {
    name: 'AI',

    register(ctx: IElectronModuleContext): void {
      if (state !== 'created') {
        throw new Error(
          `AIElectronModule.register() called while in '${state}' state; a handle may only register once from 'created'`,
        );
      }

      const installed: string[] = [];

      try {
        const aiModule = options.instance;

        // -- Provider Config --
        ipcMain.handle(AIChannels.CAPABILITIES_GET, async () =>
          withAuthenticatedValue(ctx, async () => aiModule.api.getCapabilities()),
        );
        installed.push(AIChannels.CAPABILITIES_GET);
        ipcMain.handle(AIChannels.PROVIDER_CREATE, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.createProvider(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.PROVIDER_CREATE);
        ipcMain.handle(AIChannels.PROVIDER_LIST, async () =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.listProviders({
              identityId: requestContext.identityId,
            });
            if (!result.ok) {
              return result;
            }
            // Align Desktop IPC with contracts ListAIProviderConfigsRes / HTTP list envelope.
            return ok({ data: result.data });
          }),
        );
        installed.push(AIChannels.PROVIDER_LIST);
        ipcMain.handle(AIChannels.PROVIDER_GET, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.getProvider(id, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.PROVIDER_GET);
        ipcMain.handle(AIChannels.PROVIDER_UPDATE, async (_, payload) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.updateProvider(String(payload.id), payload, {
              identityId: requestContext.identityId,
            }),
          ),
        );
        installed.push(AIChannels.PROVIDER_UPDATE);
        ipcMain.handle(AIChannels.PROVIDER_DELETE, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.deleteProvider(id, {
              identityId: requestContext.identityId,
            });
            if (!result.ok) return result;
            // Align with HTTP void success: data:null (no undefined dual-track).
            return ok(null);
          }),
        );
        installed.push(AIChannels.PROVIDER_DELETE);
        ipcMain.handle(AIChannels.PROVIDER_TEST, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.testConnection(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.PROVIDER_TEST);
        ipcMain.handle(AIChannels.PROVIDER_SET_DEFAULT, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.setDefaultProvider(dto.providerId, {
              identityId: requestContext.identityId,
            });
            if (!result.ok) return result;
            return ok(null);
          }),
        );
        installed.push(AIChannels.PROVIDER_SET_DEFAULT);
        ipcMain.handle(AIChannels.PROVIDER_REFRESH_MODELS, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.refreshProviderModels(String(id), { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.PROVIDER_REFRESH_MODELS);

        // -- Goal Generation --
        ipcMain.handle(AIChannels.GOAL_GENERATE, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.generateGoal({
              identityId: requestContext.identityId,
              ...dto,
            }),
          ),
        );
        installed.push(AIChannels.GOAL_GENERATE);

        // -- Conversations --
        ipcMain.handle(AIChannels.CONVERSATION_CREATE, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.createConversation({ identityId: requestContext.identityId }, dto.name),
          ),
        );
        installed.push(AIChannels.CONVERSATION_CREATE);
        ipcMain.handle(AIChannels.CONVERSATION_UPDATE, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.updateConversation(
              String(dto.id),
              {
                name: String(dto.name),
              },
              { identityId: requestContext.identityId },
            ),
          ),
        );
        installed.push(AIChannels.CONVERSATION_UPDATE);
        ipcMain.handle(AIChannels.CONVERSATION_LIST, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.listConversations(
              { identityId: requestContext.identityId },
              Number(dto?.page ?? 1),
              Number(dto?.pageSize ?? 20),
            ),
          ),
        );
        installed.push(AIChannels.CONVERSATION_LIST);
        ipcMain.handle(AIChannels.CONVERSATION_GET, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.getConversation(
              String(id),
              { identityId: requestContext.identityId },
              true,
            );
            if (!result.ok) return result;
            return result.data ?? null;
          }),
        );
        installed.push(AIChannels.CONVERSATION_GET);
        ipcMain.handle(AIChannels.CONVERSATION_DELETE, async (_, id) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.deleteConversation(String(id), {
              identityId: requestContext.identityId,
            });
            if (!result.ok) return result;
            return ok(null);
          }),
        );
        installed.push(AIChannels.CONVERSATION_DELETE);

        // -- Chat Messages --
        ipcMain.handle(AIChannels.MESSAGE_SEND, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.sendMessage(
              String(dto.conversationId),
              String(dto.content),
              { identityId: requestContext.identityId },
              dto.providerId,
              dto.model,
            ),
          ),
        );
        installed.push(AIChannels.MESSAGE_SEND);
        ipcMain.handle(AIChannels.MESSAGE_STREAM_START, async (event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const payload = dto as {
              streamId?: unknown;
              conversationId?: unknown;
              content?: unknown;
              providerId?: unknown;
              model?: unknown;
            };
            const streamId = String(payload.streamId ?? '');
            if (!streamId) {
              return fail({ code: 'VALIDATION_ERROR', message: 'Missing streamId' });
            }

            const abortController = new AbortController();
            activeStreamSessions.set(streamId, {
              abortController,
              webContentsId: event.sender.id,
            });

            void (async () => {
              try {
                const result = await aiModule.api.streamMessage(
                  String(payload.conversationId ?? ''),
                  String(payload.content ?? ''),
                  (chunk) => {
                    if (!event.sender.isDestroyed()) {
                      event.sender.send(AIStreamChannels.MESSAGE_STREAM_CHUNK, {
                        streamId,
                        chunk,
                      });
                    }
                  },
                  { identityId: requestContext.identityId },
                  typeof payload.providerId === 'string' ? payload.providerId : undefined,
                  typeof payload.model === 'string' ? payload.model : undefined,
                  abortController.signal,
                );

                if (!event.sender.isDestroyed()) {
                  event.sender.send(AIStreamChannels.MESSAGE_STREAM_DONE, {
                    streamId,
                    result,
                  });
                }
              } catch (error) {
                const code =
                  error instanceof Error &&
                  (error as Error & { category?: string }).category === 'aborted'
                    ? 'ABORTED'
                    : 'INTERNAL_ERROR';
                if (!event.sender.isDestroyed()) {
                  event.sender.send(AIStreamChannels.MESSAGE_STREAM_ERROR, {
                    streamId,
                    code,
                    message: error instanceof Error ? error.message : 'AI stream failed',
                  });
                }
              } finally {
                activeStreamSessions.delete(streamId);
              }
            })();

            return ok(null);
          }),
        );
        installed.push(AIChannels.MESSAGE_STREAM_START);
        ipcMain.handle(AIChannels.MESSAGE_STREAM_CANCEL, async (event, streamId) =>
          withAuthenticatedValue(ctx, async () => {
            const session = activeStreamSessions.get(String(streamId));
            if (session && session.webContentsId === event.sender.id) {
              session.abortController.abort();
              activeStreamSessions.delete(String(streamId));
            }
            return ok(null);
          }),
        );
        installed.push(AIChannels.MESSAGE_STREAM_CANCEL);

        // Residual 353: AssistantFacade Host dispatch stream (open chat / approve / cancel).
        // Hardened (plan Step B §5.2): shared AssistantClientCommandSchema validation
        // rejects a renderer identityId; identity is injected from the authenticated
        // context; the session is bound to the sender webContentsId; every
        // success/error/catch/abort path deletes the session exactly once and never
        // emits a second DONE/ERROR frame.
        ipcMain.handle(AIChannels.ASSISTANT_DISPATCH_START, async (event, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const payload = dto as {
              streamId?: unknown;
              command?: unknown;
            };
            const streamId = String(payload.streamId ?? '');
            if (!streamId) {
              return fail({ code: 'VALIDATION_ERROR', message: 'Missing streamId' });
            }

            const parsed = AssistantClientCommandSchema.safeParse(payload.command);
            if (!parsed.success) {
              return fail({
                code: 'VALIDATION_ERROR',
                message: 'Invalid assistant command',
                details: formatZodErrors(parsed.error.issues),
              });
            }

            const abortController = new AbortController();
            activeStreamSessions.set(streamId, {
              abortController,
              webContentsId: event.sender.id,
            });

            let settled = false;
            const settle = (frame: 'done' | 'error', data: unknown) => {
              if (settled) {
                return;
              }
              settled = true;
              activeStreamSessions.delete(streamId);
              if (event.sender.isDestroyed()) {
                return;
              }
              event.sender.send(
                frame === 'done'
                  ? AIStreamChannels.ASSISTANT_DISPATCH_DONE
                  : AIStreamChannels.ASSISTANT_DISPATCH_ERROR,
                {
                  streamId,
                  ...(data as object),
                },
              );
            };

            void (async () => {
              try {
                const result = await aiModule.api.dispatchAssistant(
                  toHostCommand(parsed.data, requestContext.identityId),
                  {
                    onEvent: (assistantEvent) => {
                      if (event.sender.isDestroyed()) {
                        return;
                      }
                      event.sender.send(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
                        streamId,
                        event: assistantEvent,
                      });
                    },
                  },
                  abortController.signal,
                );

                if (abortController.signal.aborted) {
                  // Renderer already initiated CANCEL; no terminal frame after abort.
                  settled = true;
                  activeStreamSessions.delete(streamId);
                  return;
                }

                if (!result.ok) {
                  settle('error', {
                    code: result.error.code,
                    message: result.error.message,
                    details: result.error.details,
                  });
                  return;
                }
                settle('done', { result: result.data });
              } catch (error) {
                if (abortController.signal.aborted) {
                  settled = true;
                  activeStreamSessions.delete(streamId);
                  return;
                }
                settle('error', {
                  code: 'INTERNAL_ERROR',
                  message: error instanceof Error ? error.message : 'Assistant dispatch failed',
                });
              }
            })();

            return ok(null);
          }),
        );
        installed.push(AIChannels.ASSISTANT_DISPATCH_START);
        ipcMain.handle(AIChannels.ASSISTANT_DISPATCH_CANCEL, async (event, streamId) =>
          withAuthenticatedValue(ctx, async () => {
            const session = activeStreamSessions.get(String(streamId));
            if (session && session.webContentsId === event.sender.id) {
              session.abortController.abort();
              activeStreamSessions.delete(String(streamId));
            }
            return ok(null);
          }),
        );
        installed.push(AIChannels.ASSISTANT_DISPATCH_CANCEL);
        ipcMain.handle(AIChannels.MESSAGE_LIST, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await aiModule.api.getConversation(
              String(dto.conversationId),
              { identityId: requestContext.identityId },
              true,
            );
            if (!result.ok) return result;
            if (!result.data) {
              return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
            }
            const messages = result.data.messages ?? [];
            return ok({
              data: messages,
              total: messages.length,
              page: Number(dto?.page ?? 1),
              pageSize: Number(dto?.pageSize ?? 50),
            });
          }),
        );
        installed.push(AIChannels.MESSAGE_LIST);

        // -- Knowledge Notes --
        ipcMain.handle(AIChannels.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.createKnowledgeNote(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.KNOWLEDGE_NOTE_CREATE);
        ipcMain.handle(AIChannels.KNOWLEDGE_QUERY, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.queryKnowledge(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.KNOWLEDGE_QUERY);
        ipcMain.handle(AIChannels.KNOWLEDGE_EXPAND, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.expandKnowledge(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.KNOWLEDGE_EXPAND);
        ipcMain.handle(AIChannels.KNOWLEDGE_REINDEX, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.reindexKnowledge(dto ?? {}, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.KNOWLEDGE_REINDEX);
        ipcMain.handle(AIChannels.ANALYTICS_QUERY, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.queryAnalytics(dto, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.ANALYTICS_QUERY);
        ipcMain.handle(AIChannels.AGENT_RUN_LIST, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.listAgentRuns(dto ?? {}, { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.AGENT_RUN_LIST);
        ipcMain.handle(AIChannels.AGENT_RUN_START, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.startAgentRun(
              {
                ...dto,
                identityId: requestContext.identityId,
              },
              { identityId: requestContext.identityId },
            ),
          ),
        );
        installed.push(AIChannels.AGENT_RUN_START);
        ipcMain.handle(AIChannels.AGENT_RUN_RESUME, async (_, dto) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.resumeAgentRun(String(dto.runId), dto.payload, {
              identityId: requestContext.identityId,
            }),
          ),
        );
        installed.push(AIChannels.AGENT_RUN_RESUME);
        ipcMain.handle(AIChannels.AGENT_RUN_GET, async (_, runId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.getAgentRun(String(runId), { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.AGENT_RUN_GET);
        ipcMain.handle(AIChannels.AGENT_EVENTS_GET, async (_, runId) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            aiModule.api.getAgentEvents(String(runId), { identityId: requestContext.identityId }),
          ),
        );
        installed.push(AIChannels.AGENT_EVENTS_GET);
        ipcMain.handle(AIChannels.EVALUATION_OVERVIEW_GET, async (_, dto) =>
          withAuthenticatedValue(ctx, async () => aiModule.api.getEvaluationOverview(dto ?? {})),
        );
        installed.push(AIChannels.EVALUATION_OVERVIEW_GET);

        aiModule.start();
        state = 'registered';

        logger.info('AI module registered');
      } catch (error) {
        state = 'failed';
        for (let i = installed.length - 1; i >= 0; i--) {
          ipcMain.removeHandler(installed[i]);
        }
        for (const session of activeStreamSessions.values()) {
          session.abortController.abort();
        }
        activeStreamSessions.clear();
        try {
          options.instance.dispose();
        } catch (disposeError) {
          logger.error(
            'AIElectron: instance dispose failed during failed registration',
            disposeError,
          );
        }
        throw error;
      }
    },

    destroy(): void {
      if (state === 'disposed' || state === 'failed') {
        return;
      }

      for (const channel of allChannels) {
        ipcMain.removeHandler(channel);
      }
      for (const session of activeStreamSessions.values()) {
        session.abortController.abort();
      }
      activeStreamSessions.clear();
      state = 'disposed';

      options.instance.dispose();
      logger.info('AI module destroyed');
    },
  };
}
