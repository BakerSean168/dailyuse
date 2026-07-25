/**
 * Residual 405: cross-end multi-engine Host product E2E scaffold evidence.
 *
 * Freezes the product journey contract + surface locks for Web HTTP SSE,
 * Desktop IPC, and Vue Host multi-engine UI. Does not run Playwright/Electron
 * and does not claim full multi-engine product E2E or real Pi spawn.
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

describe('ADR-035 cross-end multi-engine product E2E scaffold (residual 405)', () => {
  const journey = buildCrossEndMultiEngineProductJourney();
  const summary = summarizeCrossEndMultiEngineProductJourney(journey);

  it('freezes ordered multi-engine product journey with explicit external gaps', () => {
    expect(journey.map((step) => step.id)).toEqual([
      'ui.select_direct_turn',
      'web.send_direct_turn',
      'desktop.send_direct_turn',
      'ui.timeline_engine_badge_direct',
      'ui.select_pi_readonly',
      'web.send_pi_readonly',
      'desktop.send_pi_readonly',
      'ui.stop_cancel_run',
      'host.mid_turn_cancel',
      'ui.conversation_switch_badge_memory',
      'ui.timeline_surface_isolation',
      'ui.workbench_timeline_composition',
      'ui.langgraph_diagnostic_sanitization',
      'ui.task_create_proposal_receipt_lane',
      'e2e.playwright_web_full',
      'e2e.electron_desktop_full',
      'e2e.real_pi_spawn',
    ]);
    expect(summary.total).toBe(17);
    // Residual 1342: Web Playwright multi-engine Host product e2e is implemented_unit.
    expect(summary.implementedUnit).toBe(15);
    expect(summary.externalBlocked).toBe(2);
    expect(summary.readyForDriver).toBe(true);
    expect(
      journey.filter((step) => step.status === 'external_blocked').every((step) => step.blockedReason),
    ).toBe(true);
    const webE2e = journey.find((step) => step.id === 'e2e.playwright_web_full');
    expect(webE2e?.status).toBe('implemented_unit');
    expect(webE2e?.contracts.join(' ')).toContain('multi-engine-host.spec.ts');
  });

  it('locks Web HTTP SSE multi-profile + cancel_run transport contracts', () => {
    const http = read(
      'packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
    );
    const httpTest = read(
      'packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts',
    );
    const controller = read(
      'packages/ai/src/server/transport/ai-assistant-facade.controller.ts',
    );

    expect(http).toContain('/ai/assistant/dispatch/sse');
    expect(http).toContain('dispatchAssistant');
    expect(httpTest).toContain('executionProfileId');
    expect(httpTest).toContain('pi_readonly');
    expect(httpTest).toContain("type: 'cancel_run'");
    expect(httpTest).toContain('without identityId');
    expect(controller).toContain("z.enum(['direct_turn', 'pi_readonly'])");
    expect(controller).not.toContain('process.pi_readonly_spike');
  });

  it('locks Desktop IPC multi-profile + cancel_run transport contracts', () => {
    const ipc = read(
      'packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts',
    );
    const ipcTest = read(
      'packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts',
    );
    const channels = read('packages/contracts/src/electron/ipc-channels.ts');

    expect(ipc).toContain('dispatchAssistant');
    expect(ipcTest).toContain('executionProfileId');
    expect(ipcTest).toContain('pi_readonly');
    expect(ipcTest).toContain("type: 'cancel_run'");
    expect(channels).toContain("ASSISTANT_DISPATCH_START: 'ai:assistant:dispatch:start'");
    expect(channels).toContain("ASSISTANT_DISPATCH_CANCEL: 'ai:assistant:dispatch:cancel'");
  });

  it('locks Vue multi-engine Host product selectors for future Playwright drivers', () => {
    const composer = read(
      'packages/app-vue/src/modules/ai/components/AIFooterComposer.vue',
    );
    const session = read(
      'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
    );
    const timeline = read(
      'packages/app-vue/src/modules/ai/components/AIHostTimelineArtifactStrip.vue',
    );
    const turnMemory = read(
      'packages/app-vue/src/modules/ai/composables/hostOpenChatTurnMemory.ts',
    );

    expect(composer).toContain('ai-chat-execution-profile');
    expect(composer).toContain('ai-chat-execution-profile-direct');
    expect(composer).toContain('ai-chat-execution-profile-readonly');
    expect(composer).toContain('ai-chat-stop-generating');
    expect(session).toContain('executionProfileId');
    expect(session).toContain('createHostOpenChatRunId');
    expect(session).toContain('buildHostOpenChatStopCancelCommand');
    expect(session).toContain('openChatHostTurns');
    expect(timeline).toContain('ai-host-timeline-artifact-strip');
    expect(timeline).toContain('ai-host-timeline-artifact-engine-');
    expect(timeline).toContain('data-engine-key');
    expect(turnMemory).toContain('rememberOpenChatHostTurnsForConversation');
    expect(turnMemory).toContain('restoreOpenChatHostTurnsForConversation');
  });

  it('keeps process spike out of product multi-engine path and mid-turn cancel evidence present', () => {
    const facade = read(
      'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
    );
    const productionJourney = read(
      'packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-production-multi-engine-host.journey.spec.ts',
    );
    const processAdapter = read(
      'packages/ai/src/server/infrastructure/turn-engine/pi-readonly-process.adapter.ts',
    );

    expect(facade).not.toContain('process.pi_readonly_spike');
    expect(facade).not.toContain('PiReadonlyProcessAdapter');
    expect(facade).toContain('cancel_run');
    expect(productionJourney).toContain('mid-turn cancel_run');
    expect(productionJourney).toContain('engine.direct_turn');
    expect(productionJourney).toContain('engine.pi_readonly');
    expect(processAdapter).toContain('productDefault = false');
    expect(processAdapter).toContain('PI_SPIKE_SPAWN_BLOCKED');
    expect(processAdapter).not.toContain('child_process');
  });

  it('does not claim Playwright/Electron full product E2E green in residual 405', () => {
    const scaffold = read(
      'packages/ai/src/server/infrastructure/runtime/adr-035-cross-end-multi-engine-product.scaffold.ts',
    );
    expect(scaffold).toContain('Not a Playwright/Electron full product E2E run');
    expect(scaffold).toContain('external_blocked');
    expect(scaffold).toContain('e2e.playwright_web_full');
    expect(scaffold).toContain('e2e.electron_desktop_full');
    expect(scaffold).toContain('e2e.real_pi_spawn');
    // Fail closed: no accidental "product E2E complete" claim language.
    expect(scaffold).not.toMatch(/full multi-engine product E2E passed/i);
    expect(scaffold).not.toMatch(/Playwright green/i);
  });
});
