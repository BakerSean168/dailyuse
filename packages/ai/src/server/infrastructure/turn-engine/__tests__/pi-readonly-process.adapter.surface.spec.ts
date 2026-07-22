import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 373: Pi/CLI process adapter spike is fail-closed research surface only.
 * Never product default open-chat; never wired as AssistantFacade turn engines.
 */
describe('PiReadonlyProcessAdapter surface (residual 373)', () => {
  const root = resolve(__dirname, '../../../../../../..');
  const adapter = readFileSync(
    resolve(__dirname, '../pi-readonly-process.adapter.ts'),
    'utf8',
  );
  const ports = readFileSync(
    resolve(root, 'packages/contracts/src/modules/ai/agent-host/ports.ts'),
    'utf8',
  );
  const moduleSource = readFileSync(
    resolve(__dirname, '../../ai.module.ts'),
    'utf8',
  );
  const facade = readFileSync(
    resolve(__dirname, '../../assistant-facade/assistant.facade.ts'),
    'utf8',
  );

  it('freezes external process Turn adapter port shape', () => {
    expect(ports).toContain('export interface IExternalProcessTurnAdapterPort');
    expect(ports).toContain('extends ITurnEnginePort');
    expect(ports).toContain('productDefault: false');
    expect(ports).toContain('readonlyMode: true');
    expect(ports).toContain('probe(): Promise<ExternalProcessProbeResult>');
  });

  it('process adapter is fail-closed and never product default', () => {
    expect(adapter).toContain("PI_READONLY_PROCESS_ADAPTER_ID = 'process.pi_readonly_spike'");
    expect(adapter).toContain('productDefault = false');
    expect(adapter).toContain('PI_SPIKE_SPAWN_BLOCKED');
    expect(adapter).toContain('buildScrubbedEnv');
    expect(adapter).toContain('FORBIDDEN_ENV_KEYS');
    expect(adapter).not.toContain('spawn(');
    expect(adapter).not.toContain('child_process');
    expect(adapter).not.toContain('execFile');
  });

  it('does not wire process adapter into production module Turn Engines or Facade', () => {
    expect(moduleSource).not.toContain('PiReadonlyProcessAdapter');
    expect(moduleSource).not.toContain('process.pi_readonly_spike');
    expect(facade).not.toContain('PiReadonlyProcessAdapter');
    expect(facade).not.toContain('process.pi_readonly_spike');
    // Production readonly path remains Model Gateway engine.pi_readonly
    expect(moduleSource).toContain('readonlyTurnEngine');
  });
});
