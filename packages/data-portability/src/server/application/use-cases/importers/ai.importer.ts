/**
 * AI module importer — handles conversations and messages.
 */

import type { ImportContext } from '../../portable-runtime';
import type { PortableAIData } from '@dailyuse/contracts/data-portability';
import type { TxClient } from './import-helpers';
import { allocateId, jsonStringify, inc, rec, timestamps, createdTimestamp } from './import-helpers';

export async function importAI(
  tx: TxClient, ctx: ImportContext, data: PortableAIData,
): Promise<void> {
  for (const conversation of data.conversations) {
    const c = rec(conversation);
    const convId = allocateId(ctx, c._ref as string);
    await tx.createAIConversation({
      id: convId, identityId: ctx.identityId,
      name: c.name as string, status: (c.status as string) ?? 'ACTIVE',
      ...timestamps(c),
    });

    for (const msg of (c.messages as unknown[] ?? [])) {
      const m = rec(msg);
      const msgId = allocateId(ctx, m._ref as string);
      await tx.createAIMessage({
        id: msgId, identityId: ctx.identityId, conversationId: convId,
        role: m.role as string, content: m.content as string,
        tokenUsage: m.tokenCount ? jsonStringify({ count: m.tokenCount }) : null,
        ...createdTimestamp(m),
      });
    }
    inc(ctx, 'aiConversations');
  }
}
