/**
 * PiReadonlyProcessAdapter — ADR-035 stage 5/6 process-shaped spike (residual 373).
 *
 * Occupies a process adapter surface for future Pi CLI isolation research.
 * This is intentionally NOT product default open chat and is NOT wired into
 * AssistantFacade production routing.
 *
 * Current spike policy (fail closed):
 * - Probe may report binary path availability via DAILYUSE_PI_BINARY
 * - startTurn never spawns a process (spawn blocked until security review)
 * - never sets cwd to a vault path
 * - never injects Daily Use / GitHub / Provider tokens into env
 * - never treats CLI-native writes as business mutations
 *
 * Real pi-agent-core / pi-coding-agent integration remains open (compat side effects).
 */
import { accessSync, constants as fsConstants } from 'node:fs';
import type {
  ExternalProcessProbeResult,
  IExternalProcessTurnAdapterPort,
} from '@dailyuse/contracts/ai';

/** Diagnostic engine id — not a product mode label. */
export const PI_READONLY_PROCESS_ADAPTER_ID = 'process.pi_readonly_spike' as const;

/**
 * Research pin label only. Not installed as a product dependency in this residual.
 * Formal introduce must isolate pi-ai/compat static side effects first (ADR-035 §11.2).
 */
export const PI_SPIKE_PINNED_LABEL = 'pi-agent-core@spike-unpinned' as const;

/** Env: absolute path to a Pi-compatible CLI binary for probe only. */
export const PI_SPIKE_BINARY_ENV = 'DAILYUSE_PI_BINARY' as const;

/** Env: must be "1" for probe to report available (still does not enable spawn). */
export const PI_SPIKE_ENABLED_ENV = 'DAILYUSE_PI_SPIKE_ENABLED' as const;

const FORBIDDEN_ENV_KEYS = [
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DAILYUSE_DB_URL',
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
] as const;

export type PiReadonlyProcessAdapterOptions = {
  /** Override env lookup (tests). */
  env?: NodeJS.ProcessEnv;
  /** Override binary existence check (tests). */
  isExecutable?: (path: string) => boolean;
};

function defaultIsExecutable(path: string): boolean {
  try {
    accessSync(path, fsConstants.X_OK);
    return true;
  } catch {
    try {
      accessSync(path, fsConstants.R_OK);
      return true;
    } catch {
      return false;
    }
  }
}

export class PiReadonlyProcessAdapter implements IExternalProcessTurnAdapterPort {
  readonly engineId = PI_READONLY_PROCESS_ADAPTER_ID;
  readonly productDefault = false as const;
  readonly readonlyMode = true as const;
  readonly placement = 'desktop' as const;

  private readonly env: NodeJS.ProcessEnv;
  private readonly isExecutable: (path: string) => boolean;
  private readonly aborted = new Set<string>();

  constructor(options: PiReadonlyProcessAdapterOptions = {}) {
    this.env = options.env ?? process.env;
    this.isExecutable = options.isExecutable ?? defaultIsExecutable;
  }

  /**
   * Build a scrubbed env for a hypothetical process spawn.
   * Always strips known secrets; never copies GITHUB/OPENAI/DB credentials.
   */
  buildScrubbedEnv(base: NodeJS.ProcessEnv = this.env): Record<string, string> {
    const scrubbed: Record<string, string> = {};
    for (const [key, value] of Object.entries(base)) {
      if (value === undefined) continue;
      if ((FORBIDDEN_ENV_KEYS as readonly string[]).includes(key)) continue;
      if (/token|secret|password|api[_-]?key/i.test(key)) continue;
      scrubbed[key] = value;
    }
    // Spike never injects vault path as cwd via env either.
    delete scrubbed.DAILYUSE_VAULT_PATH;
    delete scrubbed.OBSIDIAN_VAULT_PATH;
    return scrubbed;
  }

  /** Spike forbids using a real vault directory as process cwd. */
  resolveProcessCwd(_requestedVaultPath?: string): string {
    // Intentionally ignore vault path — use process cwd or tmp only in future spawn.
    return process.cwd();
  }

  async probe(): Promise<ExternalProcessProbeResult> {
    if (this.env[PI_SPIKE_ENABLED_ENV] !== '1') {
      return {
        status: 'unavailable',
        reason: 'PI_SPIKE_DISABLED',
      };
    }
    const binaryPath = (this.env[PI_SPIKE_BINARY_ENV] ?? '').trim();
    if (!binaryPath) {
      return {
        status: 'unavailable',
        reason: 'PI_BINARY_UNCONFIGURED',
      };
    }
    if (!this.isExecutable(binaryPath)) {
      return {
        status: 'unavailable',
        reason: 'PI_BINARY_UNAVAILABLE',
      };
    }
    return {
      status: 'available',
      binaryPath,
      pinnedLabel: PI_SPIKE_PINNED_LABEL,
    };
  }

  async abort(runId: string): Promise<void> {
    this.aborted.add(runId);
  }

  async startTurn(input: {
    runId: string;
    identityId: string;
    conversationId?: string;
    message: string;
    signal?: AbortSignal;
  }): Promise<{ status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'; error?: string }> {
    if (!input.identityId?.trim()) {
      return { status: 'failed', error: 'IDENTITY_REQUIRED' };
    }
    if (this.aborted.has(input.runId) || input.signal?.aborted) {
      return { status: 'aborted' };
    }

    const probe = await this.probe();
    if (probe.status === 'unavailable') {
      return { status: 'failed', error: probe.reason };
    }

    // Residual 373: spawn intentionally blocked — research spike only.
    // Product path remains ReadonlyAnalysisTurnEngine (Model Gateway) / DirectTurnEngine.
    return {
      status: 'failed',
      error: 'PI_SPIKE_SPAWN_BLOCKED: process adapter not product-ready; use engine.pi_readonly Model Gateway path',
    };
  }
}
