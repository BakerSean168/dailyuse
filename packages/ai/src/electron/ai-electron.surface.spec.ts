import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AIChannels, AIStreamChannels } from '@memoflow/contracts/electron';

describe('AIElectronModule Mastra-native channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers canonical Assistant/Workflow channels and no retired AgentHost channels', () => {
    expect(source).toContain('AIChannels.RUNTIME_ASSISTANT_START');
    expect(source).toContain('AIChannels.RUNTIME_ASSISTANT_CANCEL');
    expect(source).toContain('AIChannels.RUNTIME_ASSISTANT_HISTORY');
    expect(source).toContain('AIChannels.RUNTIME_USAGE_GET');
    expect(source).toContain('AIChannels.RUNTIME_WORKFLOW_START');
    expect(source).toContain('AIChannels.RUNTIME_WORKFLOW_RESUME');
    expect(source).toContain('AIChannels.RUNTIME_WORKFLOW_GET');
    expect(source).toContain('AIChannels.RUNTIME_WORKFLOW_LIST');
    expect(source).toContain('AIChannels.RUNTIME_WORKFLOW_CANCEL');
    expect(source).toContain('AIStreamChannels.RUNTIME_ASSISTANT_EVENT');
    expect(source).not.toContain('AIChannels.ASSISTANT_DISPATCH_START');
    expect(source).not.toContain('AIChannels.AGENT_RUN_START');
    expect(source).not.toContain('AIChannels.MESSAGE_STREAM_START');
    expect(source).not.toContain('AIChannels.GOAL_GENERATE');
  });

  it('does not hard-code retired stream channel strings', () => {
    expect(source).not.toContain("'ai:chat:message:stream:chunk'");
    expect(source).not.toContain("'ai:assistant:dispatch:event'");
    expect(AIStreamChannels.RUNTIME_ASSISTANT_EVENT).toBeTruthy();
  });
});
