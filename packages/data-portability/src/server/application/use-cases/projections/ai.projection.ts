/**
 * AI Module — Export Projections
 */

import type { ExportContext } from '../../portable-runtime';
import type { PortableAIConversation } from '@memoflow/contracts/data-portability';
import { parseJsonField, toDateString } from './projection-helpers';

function tokenCountFromUsage(value: unknown): number | null | undefined {
  if (typeof value === 'number') return value;
  const usage = parseJsonField(value);
  if (!usage || typeof usage !== 'object') return undefined;
  const record = usage as Record<string, unknown>;
  const count =
    (record.totalTokens as number | undefined) ??
    (record.total_tokens as number | undefined) ??
    (record.tokens as number | undefined);
  return typeof count === 'number' ? count : undefined;
}

export function projectAIConversations(conversations: unknown[], ctx: ExportContext): PortableAIConversation[] {
  return conversations.map((c) => {
    const entity = c as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('aiConversation');
    ctx.refToIdMap.set(entity.id as string, ref);

    const messages = ((entity.messages as unknown[]) ?? []).map((m) => {
      const msg = m as Record<string, unknown>;
      const msgRef = ctx.refAllocator.allocate('aiMessage');
      ctx.refToIdMap.set(msg.id as string, msgRef);
      return {
        _ref: msgRef,
        role: msg.role as string,
        content: msg.content as string,
        tokenCount: (msg.tokenCount as number | null | undefined) ?? tokenCountFromUsage(msg.tokenUsage),
        createdAt: toDateString(msg.createdAt),
        updatedAt: toDateString(msg.updatedAt),
      };
    });

    return {
      _ref: ref,
      name: entity.name as string,
      status: entity.status as string,
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
      messages,
    };
  });
}
