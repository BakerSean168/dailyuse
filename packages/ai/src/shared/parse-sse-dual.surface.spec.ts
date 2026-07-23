import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSSE } from './parse-sse';

/**
 * Residual 977: parseSSE dual retired.
 * Sole body in parse-sse.ts; assistant/message HTTP adapters + server chat-execution import it.
 * Soft residual 963: findSSEBoundary dual retired (find-sse-boundary-dual.surface.spec.ts).
 * Soft residual 984: tip focused suite numbers track Residual 984 evidence tip (282/1237).
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
