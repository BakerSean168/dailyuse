import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 259: StreamMessageDonePayload identity dual is gone.
 * Stream done / stream start payloads use SendMessageRes directly.
 */
describe('AI StreamMessageDonePayload dual single-track surface', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-chat.dto.ts'), 'utf8');
  const eventMap = readFileSync(resolve(apiDir, '../protocol/ai-event-map.ts'), 'utf8');
  const rpcMap = readFileSync(resolve(apiDir, '../protocol/ai-rpc-map.ts'), 'utf8');

  it('does not dual-alias StreamMessageDonePayload = SendMessageRes', () => {
    expect(dto).not.toMatch(/export type StreamMessageDonePayload\s*=/);
    expect(dto).not.toContain('StreamMessageDonePayload');
  });

  it('protocol maps use SendMessageRes for stream done/start payloads', () => {
    expect(eventMap).toContain('SendMessageRes');
    expect(eventMap).toMatch(/result:\s*SendMessageRes/);
    expect(eventMap).not.toContain('StreamMessageDonePayload');
    expect(rpcMap).toContain("'ai:chat:message:stream:start': [SendMessageReq, SendMessageRes]");
    expect(rpcMap).not.toContain('StreamMessageDonePayload');
  });
});
