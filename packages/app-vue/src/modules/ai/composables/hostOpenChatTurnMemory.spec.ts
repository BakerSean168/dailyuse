import { describe, expect, it } from 'vitest';
import {
  forgetOpenChatHostTurnsForConversation,
  rememberOpenChatHostTurnsForConversation,
  restoreOpenChatHostTurnsForConversation,
  upsertOpenChatHostTurnList,
} from './hostOpenChatTurnMemory';
import type { HostOpenChatTurnSnapshot } from './hostProposalLifecycle';

function turn(
  overrides: Partial<HostOpenChatTurnSnapshot> & Pick<HostOpenChatTurnSnapshot, 'runId'>,
): HostOpenChatTurnSnapshot {
  return {
    executionProfileId: 'direct_turn',
    status: 'completed',
    title: 'hello',
    ...overrides,
  };
}

describe('hostOpenChatTurnMemory (residual 403)', () => {
  it('upserts turns newest-first and caps the ring', () => {
    let list: HostOpenChatTurnSnapshot[] = [];
    list = upsertOpenChatHostTurnList(list, turn({ runId: 'r1', title: 'a' }));
    list = upsertOpenChatHostTurnList(list, turn({ runId: 'r2', title: 'b' }));
    list = upsertOpenChatHostTurnList(
      list,
      turn({ runId: 'r1', title: 'a2', executionProfileId: 'pi_readonly' }),
    );
    expect(list.map((item) => item.runId)).toEqual(['r1', 'r2']);
    expect(list[0]).toMatchObject({
      title: 'a2',
      executionProfileId: 'pi_readonly',
    });

    list = [];
    for (let i = 0; i < 12; i += 1) {
      list = upsertOpenChatHostTurnList(list, turn({ runId: `r${i}` }), 8);
    }
    expect(list).toHaveLength(8);
    expect(list[0]?.runId).toBe('r11');
    expect(list.at(-1)?.runId).toBe('r4');
  });

  it('remembers and restores turns per conversation without cross-talk', () => {
    let memory = {};
    memory = rememberOpenChatHostTurnsForConversation(memory, 'conv-a', [
      turn({ runId: 'a1', executionProfileId: 'pi_readonly' }),
    ]);
    memory = rememberOpenChatHostTurnsForConversation(memory, 'conv-b', [
      turn({ runId: 'b1', executionProfileId: 'direct_turn' }),
    ]);

    expect(restoreOpenChatHostTurnsForConversation(memory, 'conv-a')).toEqual([
      expect.objectContaining({ runId: 'a1', executionProfileId: 'pi_readonly' }),
    ]);
    expect(restoreOpenChatHostTurnsForConversation(memory, 'conv-b')[0]?.runId).toBe('b1');
    expect(restoreOpenChatHostTurnsForConversation(memory, 'missing')).toEqual([]);
    expect(restoreOpenChatHostTurnsForConversation(memory, '  ')).toEqual([]);

    // Restored copy is isolated from memory mutations.
    const restored = restoreOpenChatHostTurnsForConversation(memory, 'conv-a');
    restored[0]!.title = 'mutated';
    expect(memory['conv-a']?.[0]?.title).toBe('hello');
  });

  it('forgets deleted conversations and clears empty remembers', () => {
    let memory = rememberOpenChatHostTurnsForConversation({}, 'conv-a', [
      turn({ runId: 'a1' }),
    ]);
    memory = rememberOpenChatHostTurnsForConversation(memory, 'conv-a', []);
    expect(restoreOpenChatHostTurnsForConversation(memory, 'conv-a')).toEqual([]);

    memory = rememberOpenChatHostTurnsForConversation({}, 'conv-a', [turn({ runId: 'a1' })]);
    memory = forgetOpenChatHostTurnsForConversation(memory, 'conv-a');
    expect(restoreOpenChatHostTurnsForConversation(memory, 'conv-a')).toEqual([]);
    expect(forgetOpenChatHostTurnsForConversation(memory, 'nope')).toEqual(memory);
  });
});
