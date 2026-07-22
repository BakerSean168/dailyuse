import { describe, expect, it } from 'vitest';
import { buildHostTaskCreateStartResult } from '../host-task-create-start';
import { buildHostTaskCreateResumeResult } from '../host-task-create-resume';
import type { AgentStartRunRequest } from '@dailyuse/contracts/ai';

function request(runId: string): AgentStartRunRequest {
  return {
    runId,
    threadId: `thread-${runId}`,
    conversationId: 'conv-1',
    identityId: 'identity-body',
    agentType: 'task.create',
    locale: 'en-US',
    input: { title: 'Ship residual 439' },
  };
}

describe('host-task-create-resume (residual 437/439/453/455/463/465)', () => {
  it('cancel moves waiting_approval to cancelled and clears interrupts', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-cancel'),
      identityId: 'id-1',
      nowMs: 10,
    });
    const cancelled = buildHostTaskCreateResumeResult({
      current: started,
      payload: { userDecision: 'cancel' },
      nowMs: 20,
    });
    expect(cancelled.run.status).toBe('cancelled');
    expect(cancelled.run.updatedAt).toBe(20);
    expect(cancelled.state.pendingActions).toEqual([]);
    expect(cancelled.interrupts).toEqual([]);
    expect(cancelled.events.at(-1)?.type).toBe('run.completed');
    expect(cancelled.events.at(-1)?.data?.['userDecision']).toBe('cancel');
  });

  it('confirm records executedActions and completes without pending approval', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-complete'),
      identityId: 'id-1',
      nowMs: 10,
    });
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-1',
          },
        ],
      },
      nowMs: 30,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.pendingActions).toEqual([]);
    expect(completed.state.executedActions).toHaveLength(1);
    expect(completed.state.executedActions[0]?.entityId).toBe('tpl-1');
    expect(completed.interrupts).toEqual([]);
  });

  it('edit revises pending create_task_template and stays waiting_approval', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit'),
      identityId: 'id-1',
      nowMs: 10,
    });
    const edited = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'edit',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'Revised',
            payload: { title: 'Revised title', goalId: 'goal-9' },
          },
        ],
      },
      nowMs: 40,
    });
    expect(edited.run.status).toBe('waiting_approval');
    expect(edited.state.pendingActions[0]?.payload['title']).toBe('Revised title');
    expect(edited.state.pendingActions[0]?.payload['goalId']).toBe('goal-9');
    expect(edited.interrupts[0]?.pendingActions[0]?.payload['title']).toBe('Revised title');
    expect(edited.events.at(-1)?.type).toBe('approval.required');
    expect(edited.events.at(-1)?.data?.['userDecision']).toBe('edit');
  });

  it('cancel/confirm are idempotent on terminal status', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-idemp'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const cancelled = buildHostTaskCreateResumeResult({
      current: started,
      payload: { userDecision: 'cancel' },
      nowMs: 2,
    });
    const again = buildHostTaskCreateResumeResult({
      current: cancelled,
      payload: { userDecision: 'cancel' },
      nowMs: 3,
    });
    expect(again).toBe(cancelled);
    expect(again.events.filter((e) => e.data?.['userDecision'] === 'cancel')).toHaveLength(1);

    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-idemp',
          },
        ],
      },
      nowMs: 4,
    });
    const completeAgain = buildHostTaskCreateResumeResult({
      current: completed,
      payload: { userDecision: 'confirm' },
      nowMs: 5,
    });
    expect(completeAgain).toBe(completed);
  });

  it('confirm fails closed without client executedActions settlement (residual 453)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-no-settlement'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: { userDecision: 'confirm' },
      }),
    ).toThrow(/requires non-empty client executedActions settlement/);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'other_tool',
              status: 'executed',
              message: 'nope',
            },
          ],
        },
      }),
    ).toThrow(/must use tool create_task_template/);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'failed',
              message: 'nope',
            },
          ],
        },
      }),
    ).toThrow(/must report status executed/);
  });

  it('cross-terminal cancel/confirm after opposite terminal fails closed (residual 453)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-cross-terminal'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const cancelled = buildHostTaskCreateResumeResult({
      current: started,
      payload: { userDecision: 'cancel' },
      nowMs: 2,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: cancelled,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'Created',
            },
          ],
        },
      }),
    ).toThrow(/confirm requires waiting_approval/);

    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created',
            entityId: 'tpl-x',
          },
        ],
      },
      nowMs: 3,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: completed,
        payload: { userDecision: 'cancel' },
      }),
    ).toThrow(/cancel requires a non-terminal active run/);
  });

  it('fails closed for unsupported userDecision', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-bad'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: { userDecision: 'clarify', clarificationAnswers: ['x'] },
      }),
    ).toThrow(/does not support userDecision/);
  });

  it('edit fails closed on blank title or non create_task_template tool (residual 455)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-blank'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'edit',
          approvedActions: [
            {
              tool: 'create_task_template',
              index: 0,
              dependsOn: [],
              rationale: 'blank',
              payload: { title: '   ' },
            },
          ],
        },
      }),
    ).toThrow(/requires a non-empty revised title/);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'edit',
          approvedActions: [
            {
              tool: 'other_tool',
              index: 0,
              dependsOn: [],
              rationale: 'wrong',
              payload: { title: 'Ok title' },
            },
          ],
        },
      }),
    ).toThrow(/must use tool create_task_template/);
  });

  it('edit trims revised title into pending payload (residual 455)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-trim'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const edited = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'edit',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'trim',
            payload: { title: '  Trimmed draft  ', goalId: '  goal-trim  ' },
          },
        ],
      },
      nowMs: 9,
    });
    expect(edited.state.pendingActions[0]?.payload['title']).toBe('Trimmed draft');
    expect(edited.state.pendingActions[0]?.payload['goalId']).toBe('goal-trim');
    expect(edited.events.at(-1)?.data?.['title']).toBe('Trimmed draft');
  });


  it('confirm normalizes settlement title into executed data (residual 463)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-settle-title'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-title',
            // no data.title — must recover from pending approved draft
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.executedActions[0]?.data?.['title']).toBe('Ship residual 439');
    expect(completed.events.at(-1)?.data?.['title']).toBe('Ship residual 439');
    expect(completed.state.executedActions[0]?.entityId).toBe('tpl-title');
    expect(completed.state.executedActions[0]?.data?.['templateId']).toBe('tpl-title');
    expect(completed.events.at(-1)?.data?.['templateId']).toBe('tpl-title');
  });

  it('confirm fails closed when settlement title cannot be recovered (residual 463)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-no-title'),
      identityId: 'id-1',
      nowMs: 1,
    });
    // Wipe pending title so neither executed data nor approved payload can recover.
    const stripped = {
      ...started,
      state: {
        ...started.state,
        pendingActions: [
          {
            ...started.state.pendingActions[0]!,
            payload: {},
          },
        ],
      },
      interrupts: [],
    };
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: stripped,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'Created without title',
            },
          ],
        },
      }),
    ).toThrow(/non-empty settlement title/);
  });

  it('confirm normalizes settlement template id from data when entityId missing (residual 465)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-settle-template'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            // entityId omitted — recover from data.templateId
            data: { title: 'From data', templateId: '  tpl-from-data  ' },
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.executedActions[0]?.entityId).toBe('tpl-from-data');
    expect(completed.state.executedActions[0]?.data?.['templateId']).toBe('tpl-from-data');
    expect(completed.state.executedActions[0]?.data?.['entityId']).toBe('tpl-from-data');
    expect(completed.events.at(-1)?.data?.['templateId']).toBe('tpl-from-data');
    expect(completed.events.at(-1)?.data?.['title']).toBe('From data');
  });

  it('confirm fails closed when settlement template id cannot be recovered (residual 465)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-no-template'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'Created without template id',
              data: { title: 'Has title only' },
            },
          ],
        },
      }),
    ).toThrow(/non-empty settlement template entity id/);
  });


});
