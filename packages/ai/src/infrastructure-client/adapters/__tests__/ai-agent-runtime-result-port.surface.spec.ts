import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI agent-runtime Result-port surface (stage-6 residual 100):
 * list/start/resume/get/events return Promise<Result<T>> with no throw-unwrap
 * dual-track at HTTP/IPC adapters.
 */
describe('ai agent runtime result port surface', () => {
  const apiPort = readFileSync(
    resolve(__dirname, '../../../application-client/ports/ai-api-client.port.ts'),
    'utf8',
  );
  const clientPort = readFileSync(
    resolve(__dirname, '../../../application-client/ai-client.port.ts'),
    'utf8',
  );
  const http = readFileSync(
    resolve(__dirname, '../http/ai-agent-runtime-http.adapter.ts'),
    'utf8',
  );
  const ipc = readFileSync(
    resolve(__dirname, '../ipc/ai-agent-runtime-ipc.adapter.ts'),
    'utf8',
  );

  it('AIAgentRuntimeApiClient and AIClientPort agent methods return Promise<Result<...>>', () => {
    expect(apiPort).toContain('listAgentRuns(params?: AgentRunListParams): Promise<Result<AgentRun[]>>');
    expect(apiPort).toContain(
      'startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>>',
    );
    expect(apiPort).toContain(
      'resumeAgentRun(runId: string, payload: AgentResumePayload): Promise<Result<AgentRunResult>>',
    );
    expect(apiPort).toContain('getAgentRun(runId: string): Promise<Result<AgentRunResult>>');
    expect(apiPort).toContain('getAgentEvents(runId: string): Promise<Result<AgentEvent[]>>');

    expect(clientPort).toContain(
      'listAgentRuns(params?: AgentRunListParams): Promise<Result<AgentRun[]>>',
    );
    expect(clientPort).toContain(
      'startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>>',
    );
  });

  it('HTTP/IPC adapters never unwrapResultOrThrow', () => {
    expect(http).not.toContain('unwrapResultOrThrow');
    expect(ipc).not.toContain('unwrapResultOrThrow');
    expect(http).toContain('Promise<Result<');
    expect(ipc).toContain('Promise<Result<');
  });
});
