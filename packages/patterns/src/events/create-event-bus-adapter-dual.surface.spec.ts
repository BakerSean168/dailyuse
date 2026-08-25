import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEventBusAdapter } from './index';

/**
 * Residual 1031: patterns goal/createEventBusAdapter dual retired onto events sole.
 * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
 * Does not flip §13.2 checkboxes.
 */
describe('createEventBusAdapter dual retired (residual 1031)', () => {
  const sole = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const goal = readFileSync(resolve(__dirname, '../goal/index.ts'), 'utf8');
  const root = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');

  it('owns sole createEventBusAdapter helper body', () => {
    expect(sole).toContain('Residual 1031');
    expect(sole).toMatch(/export function createEventBusAdapter\b/);
    expect(sole).toContain('await sender.dispatch(event.eventType, event.payload, {');
    expect(sole).toContain('idempotencyKey: event.idempotencyKey,');
    expect(sole).toContain('await sender.dispatch(eventType, payload)');
  });

  it('goal re-exports sole without local dual body', () => {
    expect(goal).toContain('Residual 1031');
    expect(goal).toContain("from '../events'");
    expect(goal).toContain('createEventBusAdapter');
    expect(goal).not.toMatch(/function createEventBusAdapter\b/);
    expect(goal).not.toMatch(/export function createEventBusAdapter\b/);
  });

  it('package root re-exports createEventBusAdapter from events sole', () => {
    expect(root).toContain("export { createEventBusAdapter } from './events'");
    expect(root).not.toContain("from './goal'");
  });

  it('adapter publishes via delivery-scoped sender.dispatch', async () => {
    const sent: Array<{ type: string; payload: unknown }> = [];
    const adapter = createEventBusAdapter({
      send(eventType, payload) {
        sent.push({ type: `fire-and-forget:${eventType}`, payload });
      },
      async dispatch(eventType, payload) {
        sent.push({ type: eventType, payload });
      },
    });
    await adapter.publish({
      eventType: 'x.y',
      payload: { a: 1 },
      aggregateId: 'agg-1',
      occurredAt: new Date(0),
    } as never);
    await adapter.send?.('manual', { b: 2 });
    expect(sent).toEqual([
      { type: 'x.y', payload: { a: 1 } },
      { type: 'manual', payload: { b: 2 } },
    ]);
  });
});
