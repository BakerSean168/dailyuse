/**
 * Batch-B regression lock for the historical ADR-035 cross-end scaffold.
 * The stable file name remains, but default product chat is Mastra-native.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCrossEndMultiEngineProductJourney,
  summarizeCrossEndMultiEngineProductJourney,
} from '../adr-035-cross-end-multi-engine-product.scaffold';

const root = resolve(__dirname, '../../../../../../..');
const read = (relative: string) => readFileSync(resolve(root, relative), 'utf8');

describe('ADR-035 historical scaffold after Mastra open-chat cutover', () => {
  const journey = buildCrossEndMultiEngineProductJourney();
  const summary = summarizeCrossEndMultiEngineProductJourney(journey);

  it('freezes the Mastra cutover journey and keeps external product runners explicit', () => {
    expect(journey.map((step) => step.id)).toEqual([
      'ui.mastra_runtime_injection',
      'ui.mastra_open_chat',
      'ui.legacy_profile_selector_retired',
      'web.mastra_runtime_client',
      'desktop.mastra_runtime_client',
      'transport.http_runtime_surface',
      'transport.ipc_runtime_surface',
      'runtime.one_time_transcript_bootstrap',
      'runtime.restart_persistence',
      'runtime.owner_scoped_delete',
      'runtime.model_usage_metadata',
      'runtime.python_chat_not_composed',
      'ui.workflow_timeline_isolation',
      'ui.workbench_without_open_chat_engine_badges',
      'ui.langgraph_diagnostic_sanitization',
      'e2e.playwright_web_full',
      'e2e.electron_desktop_full',
    ]);
    expect(summary).toMatchObject({
      total: 17,
      implementedUnit: 16,
      externalBlocked: 1,
      scaffolded: 0,
      readyForDriver: true,
    });
    expect(
      journey
        .filter((step) => step.status === 'external_blocked')
        .every((step) => step.blockedReason),
    ).toBe(true);
  });

  it('locks the dedicated Vue Assistant runtime seam and retirement of legacy profile selection', () => {
    const session = read('packages/app-vue/src/modules/ai/composables/useAIChatSession.ts');
    const view = read('packages/app-vue/src/modules/ai/composables/useAIChatView.ts');
    const composer = read('packages/app-vue/src/modules/ai/components/AIFooterComposer.vue');

    expect(view).toContain('AI_ASSISTANT_RUNTIME_KEY');
    expect(session).toContain('options.runtime.listMessages(conversationId)');
    expect(session).toContain('options.runtime.streamMessage(');
    expect(session).toContain('options.runtime.cancelRun(runId)');
    expect(session).toContain('options.runtime.deleteConversation(id)');
    expect(session).not.toContain('useAssistantDispatch');
    expect(session).not.toContain('executionProfileId');
    expect(composer).not.toContain('ai-chat-execution-profile');
    expect(composer).not.toContain("'select-execution-profile'");
  });

  it('locks Web/Desktop runtime clients and canonical HTTP/IPC parity', () => {
    const web = read('apps/web/src/platform/di-app.ts');
    const desktop = read('apps/desktop/src/renderer/platform/di-app.ts');
    const client = read('packages/ai/src/client/runtime-assistant.ts');
    const routes = read('packages/ai/src/api/routes/ai-runtime.routes.ts');
    const electron = read('packages/ai/src/electron/index.ts');
    const channels = read('packages/contracts/src/electron/ipc-channels.ts');

    expect(web).toContain('createAssistantRuntimeHttpClient');
    expect(web).toContain('AI_ASSISTANT_RUNTIME_KEY');
    expect(desktop).toContain('createAssistantRuntimeIpcClient');
    expect(desktop).toContain('AI_ASSISTANT_RUNTIME_KEY');

    for (const path of [
      '/ai/runtime/assistant/history',
      '/ai/runtime/assistant/delete',
      '/ai/runtime/assistant/sse',
      '/ai/runtime/assistant/cancel',
    ]) {
      expect(client).toContain(path);
    }
    expect(routes).toContain('authenticatedIdentity(req)');
    for (const channel of [
      'RUNTIME_ASSISTANT_HISTORY',
      'RUNTIME_ASSISTANT_DELETE',
      'RUNTIME_ASSISTANT_START',
      'RUNTIME_ASSISTANT_CANCEL',
    ]) {
      expect(channels).toContain(channel);
      expect(electron).toContain(channel);
    }
  });

  it('locks one-time persistent transcript migration, owner delete, and runtime metadata', () => {
    const history = read('packages/ai/src/server/mastra/runtime/assistant-history.service.ts');
    const bootstrap = read(
      'packages/ai/src/server/infrastructure/migrations/conversation-transcript-bootstrap.source.ts',
    );
    const restart = read(
      'packages/ai/src/server/mastra/runtime/assistant-history.persistence.spec.ts',
    );
    const runtime = read('packages/ai/src/server/mastra/runtime/mastra-ai.runtime.ts');

    expect(history).toContain('memoflowTranscriptBootstrapVersion');
    expect(bootstrap).toContain('includeChildren: true');
    expect(bootstrap).not.toContain('createMessage');
    expect(restart).toContain('persistent restart cutover');
    expect(restart).toContain('expect(restartedSource.load).not.toHaveBeenCalled()');
    expect(history).toContain('memory.deleteThread');
    expect(runtime).toContain("emit('assistant.run.started'");
    expect(runtime).toContain("emit('assistant.usage.updated'");
    expect(runtime).toContain('providerId');
    expect(runtime).toContain('modelId');
  });

  it('locks Python chat composition out of both hosts while preserving workflow isolation', () => {
    const apiCompose = read('apps/api/src/runtime/compose-ai.ts');
    const desktopCompose = read('apps/desktop/src/main/runtime/compose-ai.ts');
    const chatView = read('packages/app-vue/src/modules/ai/views/AIChatView.vue');

    expect(apiCompose).not.toContain('AIServiceChatExecutionAdapter');
    expect(desktopCompose).not.toContain('AIServiceChatExecutionAdapter');
    expect(apiCompose).not.toContain('chatExecutionPort:');
    expect(desktopCompose).not.toContain('chatExecutionPort:');
    expect(chatView).toContain('composeHostWorkbenchTimelineArtifacts');
    expect(chatView).toContain('openChatTurns: []');
    expect(chatView).not.toContain('openChatHostTurns');
  });

  it('records Web Playwright as implemented but keeps packaged Electron explicitly external', () => {
    const webStep = journey.find((step) => step.id === 'e2e.playwright_web_full');
    const electronStep = journey.find((step) => step.id === 'e2e.electron_desktop_full');
    expect(webStep?.status).toBe('implemented_unit');
    expect(webStep?.contracts).toContain('/ai/runtime/assistant/sse');
    expect(electronStep?.status).toBe('external_blocked');
    expect(electronStep?.blockedReason).toContain('packaged Desktop runtime');
  });
});
