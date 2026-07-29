/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 8 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: as-non-empty-string-dual.surface.spec.ts, create-stream-id-dual.surface.spec.ts, find-sse-boundary-dual.surface.spec.ts, get-request-id-dual.surface.spec.ts, is-abort-like-error-dual.surface.spec.ts, last-arg-dual.surface.spec.ts, parse-sse-dual.surface.spec.ts, preview-text-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { asNonEmptyString } from './as-non-empty-string';
import { createStreamId } from './create-stream-id';
import { findSSEBoundary } from './find-sse-boundary';
import { getRequestId } from './get-request-id';
import { isAbortLikeError } from './is-abort-like-error';
import { lastArg } from './last-arg';
import { parseSSE } from './parse-sse';
import { previewText } from './preview-text';

// --- merged from as-non-empty-string-dual.surface.spec.ts ---
{
  /**
   * Residual 1121: asNonEmptyString dual retired (AI Host/runtime input binding).
   * Sole body in as-non-empty-string.ts; host start/resume + ai-runtime import it.
   * Soft residual 1117: goal-planning toNonEmptyString remains chat-parse keep-boundary
   * (same trim shape; intentionally not force-merged into schedule optionalString).
   * Does not flip §13.2 checkboxes.
   */
  describe('asNonEmptyString dual retired (residual 1121)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'as-non-empty-string.ts'), 'utf8');
    const start = readFileSync(
      resolve(dir, '../server/infrastructure/runtime/host-task-create-start.ts'),
      'utf8',
    );
    const resume = readFileSync(
      resolve(dir, '../server/infrastructure/runtime/host-task-create-resume.ts'),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    const goalPlanning = readFileSync(
      resolve(dir, '../server/infrastructure/chat-execution/goal-planning-response.ts'),
      'utf8',
    );

    it('owns sole asNonEmptyString helper body', () => {
      expect(sole).toContain('Residual 1121');
      expect(sole).toMatch(/export function asNonEmptyString\b/);
      expect(sole).toContain("typeof value === 'string' && value.trim().length > 0");
      expect(sole).toContain('value.trim()');
      expect(sole).toContain(': undefined');
      // must not coerce via String(value) or return null
      expect(sole).not.toContain('String(value)');
      expect(sole).not.toContain('string | null');
    });

    it('host start/resume + ai-runtime import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['start', start],
        ['resume', resume],
        ['runtime', runtime],
      ] as const) {
        expect(source, label).toContain('Residual 1121');
        expect(source, label).toContain(
          "import { asNonEmptyString } from '../../../shared/as-non-empty-string'",
        );
        expect(source, label).not.toMatch(/function asNonEmptyString\b/);
        expect(source, label).not.toMatch(/function asNonEmptyTrimmedString\b/);
        expect(source, label).toContain('asNonEmptyString(');
      }
    });

    it('differs from residual 1117 goal-planning private toNonEmptyString (no force-merge into schedule)', () => {
      expect(goalPlanning).toContain('Residual 1117 keep-boundary');
      expect(goalPlanning).toMatch(/function toNonEmptyString\b/);
      expect(goalPlanning).not.toContain('as-non-empty-string');
      // soft residual comments may name sole; assert function body not dual export
      expect(goalPlanning).not.toMatch(/export function asNonEmptyString\b/);
    });

    it('runtime: non-empty trim only; empty/whitespace/non-string → undefined', () => {
      expect(asNonEmptyString('  hello  ')).toBe('hello');
      expect(asNonEmptyString('x')).toBe('x');
      expect(asNonEmptyString('')).toBeUndefined();
      expect(asNonEmptyString('   ')).toBeUndefined();
      expect(asNonEmptyString(null)).toBeUndefined();
      expect(asNonEmptyString(undefined)).toBeUndefined();
      expect(asNonEmptyString(12)).toBeUndefined();
      expect(asNonEmptyString(true)).toBeUndefined();
    });

    it('documents residual 1121 dual-retired lock without claiming §13.2 complete', () => {
      const self = readFileSync(resolve(dir, 'dual-registry.surface.spec.ts'), 'utf8');
      expect(self).toContain('Residual 1121');
      expect(self).toContain('Does not flip §13.2 checkboxes');
      expect(self).toContain('dual retired');
    });
  });
}

// --- merged from create-stream-id-dual.surface.spec.ts ---
{
  /**
   * Residual 993: createStreamId dual retired (AI IPC stream adapters).
   * Sole body in create-stream-id.ts; assistant + message IPC adapters import it.
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Does not flip §13.2 checkboxes.
   */
  describe('createStreamId dual retired (residual 993)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'create-stream-id.ts'), 'utf8');
    const assistant = readFileSync(
      resolve(dir, '../infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts'),
      'utf8',
    );
    const message = readFileSync(
      resolve(dir, '../infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts'),
      'utf8',
    );

    it('owns sole createStreamId helper body', () => {
      expect(sole).toContain('Residual 993');
      expect(sole).toMatch(/export function createStreamId\b/);
      expect(sole).toContain('globalThis.crypto');
      expect(sole).toContain('randomUUID');
      expect(sole).toContain('stream-');
    });

    it('assistant + message IPC adapters import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['assistant', assistant],
        ['message', message],
      ] as const) {
        expect(source, label).toContain('Residual 993');
        expect(source, label).toContain(
          "import { createStreamId } from '../../../shared/create-stream-id'",
        );
        expect(source, label).not.toMatch(/function createStreamId\b/);
        expect(source, label).toContain('createStreamId(');
      }
    });

    it('prefers randomUUID and falls back to stream- prefix', () => {
      const uuid = '11111111-2222-3333-4444-555555555555';
      const original = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: { randomUUID: () => uuid },
      });
      try {
        expect(createStreamId()).toBe(uuid);
      } finally {
        Object.defineProperty(globalThis, 'crypto', {
          configurable: true,
          value: original,
        });
      }

      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: {},
      });
      try {
        expect(createStreamId()).toMatch(/^stream-\d+-[0-9a-f]+$/);
      } finally {
        Object.defineProperty(globalThis, 'crypto', {
          configurable: true,
          value: original,
        });
      }
    });
  });
}

// --- merged from find-sse-boundary-dual.surface.spec.ts ---
{
  /**
   * Residual 963: findSSEBoundary dual retired.
   * Sole body in find-sse-boundary.ts.
   * Residual 977 soft: adapters no longer import findSSEBoundary directly; sole parseSSE
   * (parse-sse.ts) is the consumer. Adapters keep Residual 963 comment provenance.
   * Soft residual 980: tip focused suite numbers track Residual 980 evidence tip (280/1231).
   * Soft residual 977: parseSSE dual retired (parse-sse-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('findSSEBoundary dual retired (residual 963)', () => {
    const sharedDir = __dirname;
    const sole = readFileSync(resolve(sharedDir, 'find-sse-boundary.ts'), 'utf8');
    const parseSse = readFileSync(resolve(sharedDir, 'parse-sse.ts'), 'utf8');
    const assistant = readFileSync(
      resolve(
        sharedDir,
        '../infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
      ),
      'utf8',
    );
    const message = readFileSync(
      resolve(
        sharedDir,
        '../infrastructure-client/adapters/http/ai-message-http.adapter.ts',
      ),
      'utf8',
    );
    const chatExecution = readFileSync(
      resolve(
        sharedDir,
        '../server/infrastructure/chat-execution/ai-service-chat-execution.adapter.ts',
      ),
      'utf8',
    );

    it('owns sole findSSEBoundary helper body', () => {
      expect(sole).toContain('Residual 963');
      expect(sole).toMatch(/export function findSSEBoundary\b/);
      expect(sole).toContain('\\r\\n\\r\\n');
      expect(sole).toContain('\\n\\n');
    });

    it('parseSSE is sole consumer; adapters have no local dual bodies', () => {
      expect(parseSse).toContain("from './find-sse-boundary'");
      expect(parseSse).toContain('findSSEBoundary(buffer)');
      expect(parseSse).toMatch(/export async function\* parseSSE\b/);

      for (const [label, source] of [
        ['assistant', assistant],
        ['message', message],
        ['chatExecution', chatExecution],
      ] as const) {
        expect(source, label).toContain('Residual 963');
        expect(source, label).not.toMatch(/function findSSEBoundary\b/);
        expect(source, label).not.toMatch(/import \{ findSSEBoundary \}/);
        expect(source, label).not.toMatch(/async function\* parseSSE\b/);
      }
    });

    it('locates CRLF and LF SSE event boundaries', () => {
      expect(findSSEBoundary('data: hi\r\n\r\nnext')).toEqual({ index: 8, length: 4 });
      expect(findSSEBoundary('data: hi\n\nnext')).toEqual({ index: 8, length: 2 });
      expect(findSSEBoundary('data: incomplete')).toBeNull();
      // Prefer first boundary in buffer; CRLF before LF fragment
      expect(findSSEBoundary('a\r\n\r\nb\n\nc')).toEqual({ index: 1, length: 4 });
    });
  });
}

// --- merged from get-request-id-dual.surface.spec.ts ---
{
  /**
   * Residual 965: getRequestId dual retired.
   * Sole body in get-request-id.ts; agent-checkpoint / agent-runtime /
   * langgraph-checkpoint routes import it.
   * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
   * Soft residual 974: tip focused suite numbers track Residual 974 evidence tip (278/1223).
   * Soft residual 967: isAbortLikeError dual retired (is-abort-like-error-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('getRequestId dual retired (residual 965)', () => {
    const sharedDir = __dirname;
    const sole = readFileSync(resolve(sharedDir, 'get-request-id.ts'), 'utf8');
    const routes = {
      agentCheckpoint: readFileSync(
        resolve(sharedDir, '../api/routes/ai-agent-checkpoint.routes.ts'),
        'utf8',
      ),
      agentRuntime: readFileSync(
        resolve(sharedDir, '../api/routes/ai-agent-runtime.routes.ts'),
        'utf8',
      ),
      langgraphCheckpoint: readFileSync(
        resolve(sharedDir, '../api/routes/ai-langgraph-checkpoint.routes.ts'),
        'utf8',
      ),
    } as const;

    it('owns sole getRequestId helper body', () => {
      expect(sole).toContain('Residual 965');
      expect(sole).toMatch(/export function getRequestId\b/);
      expect(sole).toContain('req.traceId ?? req.id');
    });

    it('agent/langgraph route modules import sole without local dual bodies', () => {
      for (const [label, source] of Object.entries(routes)) {
        expect(source, label).toContain('Residual 965');
        expect(source, label).toContain(
          "import { getRequestId } from '../../shared/get-request-id'",
        );
        expect(source, label).not.toMatch(/function getRequestId\b/);
        expect(source, label).toContain('getRequestId(req)');
      }
    });

    it('prefers traceId then falls back to id', () => {
      expect(getRequestId({ traceId: 't-1', id: 'i-1' })).toBe('t-1');
      expect(getRequestId({ id: 'i-2' })).toBe('i-2');
      expect(getRequestId({ traceId: 't-3' })).toBe('t-3');
      expect(getRequestId({})).toBeUndefined();
    });
  });
}

// --- merged from is-abort-like-error-dual.surface.spec.ts ---
{
  /**
   * Residual 967: isAbortLikeError dual retired (client HTTP adapters).
   * Sole body in is-abort-like-error.ts; assistant + message HTTP adapters import it.
   * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
   * Soft residual 965: getRequestId dual retired (get-request-id-dual.surface.spec.ts).
   * Soft residual 974: tip focused suite numbers track Residual 974 evidence tip (278/1223).
   * Soft residual 969: knowledge-index value helpers dual retired (adapters/knowledge-index-value-helpers-dual.surface.spec.ts).
   * Keep-boundary: server ai-chat-helpers and app-vue useAIChatSession keep distinct
   * abort predicates (category / DOMException / ABORTED code).
   * Does not flip §13.2 checkboxes.
   */
  describe('isAbortLikeError dual retired (residual 967)', () => {
    const sharedDir = __dirname;
    const sole = readFileSync(resolve(sharedDir, 'is-abort-like-error.ts'), 'utf8');
    const assistant = readFileSync(
      resolve(
        sharedDir,
        '../infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
      ),
      'utf8',
    );
    const message = readFileSync(
      resolve(
        sharedDir,
        '../infrastructure-client/adapters/http/ai-message-http.adapter.ts',
      ),
      'utf8',
    );
    const serverHelpers = readFileSync(
      resolve(
        sharedDir,
        '../server/application/use-cases/commands/ai-chat-helpers.ts',
      ),
      'utf8',
    );

    it('owns sole isAbortLikeError helper body for client HTTP adapters', () => {
      expect(sole).toContain('Residual 967');
      expect(sole).toMatch(/export function isAbortLikeError\b/);
      expect(sole).toContain("error.name === 'AbortError'");
      expect(sole).toContain("message.includes('abort')");
      expect(sole).toContain("message.includes('cancel')");
    });

    it('assistant/message adapters import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['assistant', assistant],
        ['message', message],
      ] as const) {
        expect(source, label).toContain('Residual 967');
        expect(source, label).toContain(
          "import { isAbortLikeError } from '../../../shared/is-abort-like-error'",
        );
        expect(source, label).not.toMatch(/function isAbortLikeError\b/);
        expect(source, label).toContain('isAbortLikeError(error)');
      }
    });

    it('keeps server ai-chat-helpers abort predicate as distinct keep-boundary', () => {
      expect(serverHelpers).toMatch(/export function isAbortLikeError\b/);
      expect(serverHelpers).toContain("category === 'aborted'");
      expect(serverHelpers).not.toContain('is-abort-like-error');
    });

    it('detects AbortError name and abort/cancel message fragments', () => {
      expect(isAbortLikeError(new DOMException('aborted', 'AbortError'))).toBe(true);
      expect(isAbortLikeError({ name: 'AbortError' })).toBe(true);
      expect(isAbortLikeError({ message: 'Request aborted by user' })).toBe(true);
      expect(isAbortLikeError({ message: 'Operation cancelled' })).toBe(true);
      expect(isAbortLikeError({ message: 'network failed' })).toBe(false);
      expect(isAbortLikeError(null)).toBe(false);
      expect(isAbortLikeError('abort')).toBe(false);
    });
  });
}

// --- merged from last-arg-dual.surface.spec.ts ---
{
  /**
   * Residual 997: lastArg dual retired (AI IPC stream adapters).
   * Sole body in last-arg.ts; assistant + message IPC adapters import it.
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Soft residual 993: createStreamId dual retired (create-stream-id-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('lastArg dual retired (residual 997)', () => {
    const dir = __dirname;
    const sole = readFileSync(resolve(dir, 'last-arg.ts'), 'utf8');
    const assistant = readFileSync(
      resolve(dir, '../infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts'),
      'utf8',
    );
    const message = readFileSync(
      resolve(dir, '../infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts'),
      'utf8',
    );

    it('owns sole lastArg helper body', () => {
      expect(sole).toContain('Residual 997');
      expect(sole).toMatch(/export function lastArg\b/);
      expect(sole).toContain('args.length > 0');
      expect(sole).toContain('args[args.length - 1]');
    });

    it('assistant + message IPC adapters import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['assistant', assistant],
        ['message', message],
      ] as const) {
        expect(source, label).toContain('Residual 997');
        expect(source, label).toContain("import { lastArg } from '../../../shared/last-arg'");
        expect(source, label).not.toMatch(/function lastArg\b/);
        expect(source, label).toContain('lastArg<');
      }
    });

    it('returns last variadic argument or undefined', () => {
      expect(lastArg([])).toBeUndefined();
      expect(lastArg([1, 2, 3])).toBe(3);
      expect(lastArg(['a'])).toBe('a');
      expect(lastArg([{ streamId: 's' }])).toEqual({ streamId: 's' });
    });
  });
}

// --- merged from parse-sse-dual.surface.spec.ts ---
{
  /**
   * Residual 977: parseSSE dual retired.
   * Sole body in parse-sse.ts; assistant/message HTTP adapters + server chat-execution import it.
   * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Soft residual 979: toPrismaJson dual retired (adapters/prisma/to-prisma-json-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('parseSSE dual retired (residual 977)', () => {
    const sharedDir = __dirname;
    const sole = readFileSync(resolve(sharedDir, 'parse-sse.ts'), 'utf8');
    const assistant = readFileSync(
      resolve(sharedDir, '../infrastructure-client/adapters/http/ai-assistant-http.adapter.ts'),
      'utf8',
    );
    const message = readFileSync(
      resolve(sharedDir, '../infrastructure-client/adapters/http/ai-message-http.adapter.ts'),
      'utf8',
    );
    const chatExecution = readFileSync(
      resolve(
        sharedDir,
        '../server/infrastructure/chat-execution/ai-service-chat-execution.adapter.ts',
      ),
      'utf8',
    );

    it('owns sole parseSSE generator body', () => {
      expect(sole).toContain('Residual 977');
      expect(sole).toMatch(/export async function\* parseSSE\b/);
      expect(sole).toContain("from './find-sse-boundary'");
      expect(sole).toContain('findSSEBoundary(buffer)');
      expect(sole).toContain("line.startsWith('event:')");
      expect(sole).toContain("line.startsWith('data:')");
    });

    it('assistant/message/chat-execution import sole without local dual bodies', () => {
      for (const [label, source] of [
        ['assistant', assistant],
        ['message', message],
        ['chatExecution', chatExecution],
      ] as const) {
        expect(source, label).toContain('Residual 977');
        expect(source, label).toContain("import { parseSSE } from '../../../shared/parse-sse'");
        expect(source, label).not.toMatch(/async function\* parseSSE\b/);
        expect(source, label).not.toMatch(/function\* parseSSE\b/);
        expect(source, label).toContain('parseSSE(');
        expect(source, label).not.toMatch(/import \{ findSSEBoundary \}/);
        expect(source, label).not.toMatch(/function findSSEBoundary\b/);
      }
    });

    it('parses CRLF-framed SSE events from a streamed Response body', async () => {
      const payload = 'event: assistant\r\ndata: {"ok":true}\r\n\r\n';
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(payload));
          controller.close();
        },
      });
      const response = new Response(stream, { status: 200 });
      const events = [];
      for await (const event of parseSSE(response)) {
        events.push(event);
      }
      expect(events).toEqual([{ event: 'assistant', data: '{"ok":true}' }]);
    });
  });
}

// --- merged from preview-text-dual.surface.spec.ts ---
{
  /**
   * Residual 995: previewText dual retired (AI goal/chat observability previews).
   * Residual 1011: sole body elevated to @memoflow/utils/shared/preview-text;
   * this package re-exports so package-local import paths stay stable.
   * generate-ai-goal + automation/planning adapters + internal client import it
   * (call sites keep their maxLength args).
   * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
   * Soft residual 993: createStreamId dual retired (create-stream-id-dual.surface.spec.ts).
   * Does not flip §13.2 checkboxes.
   */
  describe('previewText dual retired (residual 995 / elevated residual 1011)', () => {
    const dir = __dirname;
    const reexport = readFileSync(resolve(dir, 'preview-text.ts'), 'utf8');
    const sole = readFileSync(
      resolve(dir, '../../../utils/src/shared/preview-text.ts'),
      'utf8',
    );
    const generateGoal = readFileSync(
      resolve(dir, '../server/application/use-cases/commands/generate-ai-goal.use-case.ts'),
      'utf8',
    );
    const automation = readFileSync(
      resolve(
        dir,
        '../server/infrastructure/chat-execution/ai-service-goal-automation.adapter.ts',
      ),
      'utf8',
    );
    const planning = readFileSync(
      resolve(
        dir,
        '../server/infrastructure/chat-execution/ai-service-goal-planning.adapter.ts',
      ),
      'utf8',
    );
    const internal = readFileSync(
      resolve(dir, '../server/infrastructure/chat-execution/ai-service-internal-client.ts'),
      'utf8',
    );

    it('re-exports utils sole previewText helper body', () => {
      expect(reexport).toContain('Residual 995');
      expect(reexport).toContain('Residual 1011');
      expect(reexport).toContain("export { previewText } from '@memoflow/utils/shared'");
      expect(reexport).not.toMatch(/export function previewText\b/);
      expect(sole).toContain('Residual 1011');
      expect(sole).toMatch(/export function previewText\b/);
      expect(sole).toContain("value.replace(/\\s+/g, ' ')");
      expect(sole).toContain('maxLength - 3');
      expect(sole).toContain('...');
      expect(sole).toContain('maxLength = 240');
    });

    it('consumers import package-local re-export without local dual bodies', () => {
      for (const [label, source, importPath] of [
        [
          'generate-ai-goal',
          generateGoal,
          "import { previewText } from '../../../../shared/preview-text'",
        ],
        [
          'automation',
          automation,
          "import { previewText } from '../../../shared/preview-text'",
        ],
        [
          'planning',
          planning,
          "import { previewText } from '../../../shared/preview-text'",
        ],
        [
          'internal',
          internal,
          "import { previewText } from '../../../shared/preview-text'",
        ],
      ] as const) {
        expect(source, label).toContain('Residual 995');
        expect(source, label).toContain(importPath);
        expect(source, label).not.toMatch(/function previewText\b/);
        expect(source, label).toContain('previewText(');
      }
    });

    it('automation/planning keep prior maxLength via call-site args', () => {
      expect(automation).toMatch(/previewText\([^)]+,\s*220\)/);
      expect(planning).toMatch(/previewText\([^)]+,\s*200\)/);
    });

    it('collapses whitespace and truncates with ellipsis', () => {
      expect(previewText(undefined)).toBeUndefined();
      expect(previewText(null)).toBeUndefined();
      expect(previewText('')).toBeUndefined();
      expect(previewText('  hello   world  ')).toBe('hello world');
      expect(previewText('abcdefghij', 7)).toBe('abcd...');
      expect(previewText('short', 240)).toBe('short');
    });
  });
}
