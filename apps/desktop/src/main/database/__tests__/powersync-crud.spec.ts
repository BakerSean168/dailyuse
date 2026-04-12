import { describe, expect, it, vi } from 'vitest';

import { serializeCrudTransaction } from '../powersync-crud';

describe('serializeCrudTransaction', () => {
  it('preserves the PowerSync SDK JSON shape', () => {
    const transaction = {
      crud: [
        {
          toJSON: vi.fn(() => ({
            op_id: 1,
            op: 'PUT',
            type: 'goals',
            id: 'goal-1',
            tx_id: 99,
            data: { title: 'Write tests' },
          })),
        },
      ],
    } as never;

    const result = serializeCrudTransaction(transaction);

    expect(result).toEqual([
      {
        op_id: 1,
        op: 'PUT',
        type: 'goals',
        id: 'goal-1',
        tx_id: 99,
        data: { title: 'Write tests' },
      },
    ]);
  });
});
