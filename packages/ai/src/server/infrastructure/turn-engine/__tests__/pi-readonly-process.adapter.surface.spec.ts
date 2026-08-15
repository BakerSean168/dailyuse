import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 373/391: Pi/CLI process adapter spike is fail-closed research surface only.
 * Never product default open-chat; never wired as AssistantFacade turn engines.
 * Residual 391 adds dry-run spawn plan (argv/env/cwd) that still forbids spawn.
 */
describe('PiReadonlyProcessAdapter surface (residual 373 / 391)', () => {
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
  const controller = readFileSync(
    resolve(__dirname, '../../../transport/ai-assistant-facade.controller.ts'),
    'utf8',
  );
  const contract = readFileSync(
    resolve(root, 'packages/contracts/src/modules/ai/agent-host/assistant-dispatch.ts'),
    'utf8',
  );
  const httpAdapter = readFileSync(
    resolve(
      __dirname,
      '../../../../infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
    ),
    'utf8',
  );
  const ipcAdapter = readFileSync(
    resolve(
      __dirname,
      '../../../../infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts',
    ),
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
    expect(adapter).toContain('buildDryRunSpawnPlan');
    expect(adapter).toContain('spawnAllowed: false');
    expect(adapter).toContain('vaultAsCwd: false');
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

  it('production transport never routes process.pi_readonly_spike (residual 391)', () => {
    // The two Host open-chat profiles live in the shared contracts schema; the
    // controller consumes it and never redefines the union.
    expect(contract).toContain("z.enum(['direct_turn', 'pi_readonly'])");
    expect(controller).toContain('AssistantClientCommandSchema');
    expect(controller).not.toContain('process.pi_readonly_spike');
    expect(controller).not.toContain('PiReadonlyProcessAdapter');
    expect(httpAdapter).not.toContain('process.pi_readonly_spike');
    expect(httpAdapter).not.toContain('PiReadonlyProcessAdapter');
    expect(ipcAdapter).not.toContain('process.pi_readonly_spike');
    expect(ipcAdapter).not.toContain('PiReadonlyProcessAdapter');
    // Client/transport product profiles stay the two Host open-chat profiles only.
    expect(contract).toMatch(/direct_turn.*pi_readonly|pi_readonly.*direct_turn/);
  });
});
