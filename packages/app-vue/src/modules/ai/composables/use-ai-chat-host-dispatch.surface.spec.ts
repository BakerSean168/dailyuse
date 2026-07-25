import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 351/369: open chat default send path goes through AssistantFacade
 * (dispatchAssistant), not streamMessage dual path. Residual 369 adds Host
 * multi-engine execution profile selection (direct_turn / pi_readonly).
 * Residual 393: stopGenerating issues Host cancel_run with client-owned runId.
 */
describe('useAIChatSession open chat Host dispatch surface', () => {
  const session = readFileSync(resolve(__dirname, 'useAIChatSession.ts'), 'utf8');
  const types = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');
  const cancelHelper = readFileSync(resolve(__dirname, 'hostOpenChatCancel.ts'), 'utf8');
  const composer = readFileSync(
    resolve(__dirname, '../components/AIFooterComposer.vue'),
    'utf8',
  );
  const chatView = readFileSync(resolve(__dirname, '../views/AIChatView.vue'), 'utf8');

  it('routes handleSendChat via dispatchAssistant with model selection', () => {
    expect(session).toContain('loadService.dispatchAssistant');
    expect(session).toContain("type: 'message'");
    expect(session).toContain('providerId: selectedModel.providerId');
    expect(session).toContain('model: selectedModel.modelId');
    // Residual 369: open chat multi-engine Host profile selection.
    expect(session).toContain('executionProfileId: executionProfileId.value');
    expect(session).toContain("ref<'direct_turn' | 'pi_readonly'>('direct_turn')");
    expect(session).toContain('selectExecutionProfile');
    expect(session).toContain("event.type === 'message.delta'");
    expect(session).toContain("event.type === 'message.completed'");
    expect(session).not.toMatch(/loadService\.streamMessage\s*\(/);
    expect(types).toContain("'dispatchAssistant'");
    expect(types).not.toMatch(/'\s*streamMessage\s*'/);
  });

  it('exposes Host engine profile control in composer and chat view (residual 369)', () => {
    expect(composer).toContain('ai-chat-execution-profile');
    expect(composer).toContain('value="pi_readonly"');
    expect(composer).toContain('value="direct_turn"');
    expect(composer).toContain("'select-execution-profile'");
    expect(chatView).toContain(':execution-profile-id="executionProfileId"');
    expect(chatView).toContain('@select-execution-profile="selectExecutionProfile"');
  });

  it('stopGenerating issues Host cancel_run with client-owned runId (residual 393)', () => {
    expect(session).toContain('createHostOpenChatRunId');
    expect(session).toContain('buildHostOpenChatStopCancelCommand');
    expect(session).toContain('activeHostRunId');
    expect(session).toContain('runId: hostRunId');
    expect(session).toContain('dispatchAssistant(cancelCommand');
    expect(cancelHelper).toContain("type: 'cancel_run'");
    expect(cancelHelper).toContain('buildHostOpenChatStopCancelCommand');
    expect(cancelHelper).not.toContain('identityId');
    // Stop control remains in composer; Host cancel is session-owned.
    expect(composer).toContain('ai-chat-stop-generating');
    expect(chatView).toContain('@stop="stopGenerating"');
  });
});
