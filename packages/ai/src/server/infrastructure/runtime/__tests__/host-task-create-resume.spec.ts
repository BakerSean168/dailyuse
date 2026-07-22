import { describe, expect, it } from 'vitest';
import { buildHostTaskCreateStartResult } from '../host-task-create-start';
import {
  buildHostTaskCreateResumeResult,
  HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE,
  HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE,
  HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE,
  HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE,
  HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE,
  HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE,
} from '../host-task-create-resume';
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

describe('host-task-create-resume (residual 437/439/453/455/463/465/467/469/471/473/475/477/481/491/495)', () => {
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
    ).toThrow(/cancel requires waiting_approval/);
  });

  it('fails closed for unsupported userDecision (residual 495)', () => {
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
    ).toThrow(HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE);
    expect(HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE).toMatch(
      /does not support userDecision/,
    );
  });

  it('fails closed when current agentType is not task.create (residual 495)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-wrong-agent'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const foreign = {
      ...started,
      run: { ...started.run, agentType: 'goal.create' as const },
    };
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: foreign as typeof started,
        payload: { userDecision: 'cancel' },
      }),
    ).toThrow(HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE);
    expect(HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE).toMatch(/agentType task\.create/);
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
            data: { title: 'Ship residual 439', templateId: '  tpl-from-data  ' },
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
    expect(completed.events.at(-1)?.data?.['title']).toBe('Ship residual 439');
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
              data: { title: 'Ship residual 439' },
            },
          ],
        },
      }),
    ).toThrow(/non-empty settlement template entity id/);
  });


  it('confirm normalizes settlement goalId from approved draft (residual 467)', () => {
    const started = buildHostTaskCreateStartResult({
      request: {
        ...request('run-settle-goal'),
        input: { title: 'Linked draft', goalId: 'goal-approved' },
      },
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
            entityId: 'tpl-goal',
            // omit data.goalId — must inherit approved draft linkage
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.executedActions[0]?.data?.['goalId']).toBe('goal-approved');
    expect(completed.events.at(-1)?.data?.['goalId']).toBe('goal-approved');
  });

  it('confirm fails closed when settlement goalId rebinds approved draft (residual 467)', () => {
    const started = buildHostTaskCreateStartResult({
      request: {
        ...request('run-goal-rebind'),
        input: { title: 'Linked draft', goalId: 'goal-approved' },
      },
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
              message: 'Created with rebound goal',
              entityId: 'tpl-rebind',
              data: { title: 'Linked draft', goalId: 'goal-other' },
            },
          ],
        },
      }),
    ).toThrow(/must not rebind settlement goalId/);
  });


  it('confirm normalizes settlement title from approved draft when executed omits title (residual 469)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-title-inherit'),
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
            entityId: 'tpl-title-inherit',
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.executedActions[0]?.data?.['title']).toBe('Ship residual 439');
    expect(completed.events.at(-1)?.data?.['title']).toBe('Ship residual 439');
  });

  it('confirm fails closed when settlement title rebinds approved draft (residual 469)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-title-rebind'),
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
              message: 'Created with rebound title',
              entityId: 'tpl-title-rebind',
              data: { title: 'Different forged title' },
            },
          ],
        },
      }),
    ).toThrow(/must not rebind settlement title/);
  });


  it('confirm uses process-local draft and ignores client approvedActions rebind (residual 471)', () => {
    const started = buildHostTaskCreateStartResult({
      request: {
        ...request('run-store-draft'),
        input: { title: 'Store draft title', goalId: 'goal-store' },
      },
      identityId: 'id-1',
      nowMs: 1,
    });
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        // Client tries to wipe/rebind draft via approvedActions — must be ignored.
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'forged',
            payload: { title: 'Forged draft', goalId: 'goal-forged' },
          },
        ],
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-store-draft',
            data: { title: 'Store draft title', goalId: 'goal-store' },
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.executedActions[0]?.data?.['title']).toBe('Store draft title');
    expect(completed.state.executedActions[0]?.data?.['goalId']).toBe('goal-store');
    expect(completed.state.approvedActions[0]?.payload?.['title']).toBe('Store draft title');
    expect(completed.state.approvedActions[0]?.payload?.['goalId']).toBe('goal-store');
  });

  it('confirm fails closed when client approvedActions would rebind executed settlement (residual 471/469)', () => {
    const started = buildHostTaskCreateStartResult({
      request: {
        ...request('run-store-rebind'),
        input: { title: 'Store draft title', goalId: 'goal-store' },
      },
      identityId: 'id-1',
      nowMs: 1,
    });
    // Client forges approvedActions AND matching executed title — still rebinds vs store draft.
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          approvedActions: [
            {
              tool: 'create_task_template',
              index: 0,
              dependsOn: [],
              rationale: 'forged',
              payload: { title: 'Forged draft', goalId: 'goal-forged' },
            },
          ],
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'Created with forged title',
              entityId: 'tpl-forged',
              data: { title: 'Forged draft', goalId: 'goal-forged' },
            },
          ],
        },
      }),
    ).toThrow(/must not rebind settlement title|must not rebind settlement goalId/);
  });

  it('confirm fails closed when executedActions is not exactly one (residual 471)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-multi-executed'),
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
              message: 'one',
              entityId: 'tpl-a',
            },
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'two',
              entityId: 'tpl-b',
            },
          ],
        },
      }),
    ).toThrow(/exactly one create_task_template executedAction/);
  });


  it('edit revises single create_task_template pending action (residual 473)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-single'),
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
            rationale: 'Revised once',
            payload: { title: 'Single revise', goalId: 'goal-single' },
          },
        ],
      },
      nowMs: 2,
    });
    expect(edited.run.status).toBe('waiting_approval');
    expect(edited.state.pendingActions).toHaveLength(1);
    expect(edited.state.pendingActions[0]?.tool).toBe('create_task_template');
    expect(edited.state.pendingActions[0]?.index).toBe(0);
    expect(edited.state.pendingActions[0]?.payload['title']).toBe('Single revise');
    expect(edited.state.pendingActions[0]?.payload['goalId']).toBe('goal-single');
    expect(edited.interrupts[0]?.pendingActions).toHaveLength(1);
  });

  it('edit fails closed when approvedActions is not exactly one (residual 473)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-multi'),
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
              rationale: 'one',
              payload: { title: 'First' },
            },
            {
              tool: 'create_task_template',
              index: 1,
              dependsOn: [],
              rationale: 'two',
              payload: { title: 'Second' },
            },
          ],
        },
      }),
    ).toThrow(/exactly one create_task_template approvedAction/);
  });


  it('confirm succeeds only from waiting_approval (residual 475)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-confirm-waiting'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(started.run.status).toBe('waiting_approval');
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created',
            entityId: 'tpl-wait',
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
  });

  it('confirm fails closed when status is waiting_execution (residual 475)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-confirm-exec-status'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const drifted = {
      ...started,
      run: {
        ...started.run,
        status: 'waiting_execution' as const,
      },
    };
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: drifted,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'executed',
              message: 'Created',
              entityId: 'tpl-exec-status',
            },
          ],
        },
      }),
    ).toThrow(/confirm requires waiting_approval/);
  });


  it('cancel succeeds from waiting_approval (residual 477)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-cancel-waiting'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(started.run.status).toBe('waiting_approval');
    const cancelled = buildHostTaskCreateResumeResult({
      current: started,
      payload: { userDecision: 'cancel' },
      nowMs: 2,
    });
    expect(cancelled.run.status).toBe('cancelled');
    expect(cancelled.state.pendingActions).toEqual([]);
    expect(cancelled.interrupts).toEqual([]);
  });

  it('cancel fails closed when status is waiting_execution (residual 477)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-cancel-exec-status'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const drifted = {
      ...started,
      run: {
        ...started.run,
        status: 'waiting_execution' as const,
      },
    };
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: drifted,
        payload: { userDecision: 'cancel' },
      }),
    ).toThrow(/cancel requires waiting_approval/);
  });



  it('edit fails closed when status is waiting_execution (residual 481)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-exec-status'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const drifted = {
      ...started,
      run: {
        ...started.run,
        status: 'waiting_execution' as const,
      },
    };
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: drifted,
        payload: {
          userDecision: 'edit',
          approvedActions: [
            {
              tool: 'create_task_template',
              index: 0,
              dependsOn: [],
              rationale: 'Revise',
              payload: { title: 'Should not apply' },
            },
          ],
        },
      }),
    ).toThrow(/edit requires waiting_approval/);
  });

  it('edit fails closed after completed (residual 481)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-after-complete'),
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
            message: 'Created',
            entityId: 'tpl-edit-after',
            data: { title: 'Ship residual 439' },
          },
        ],
      },
      nowMs: 2,
    });
    expect(completed.run.status).toBe('completed');
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: completed,
        payload: {
          userDecision: 'edit',
          approvedActions: [
            {
              tool: 'create_task_template',
              index: 0,
              dependsOn: [],
              rationale: 'Revise after complete',
              payload: { title: 'Should not apply' },
            },
          ],
        },
      }),
    ).toThrow(/edit requires waiting_approval/);
  });


  it('edit fails closed on missing approvedActions with named constant (residual 491)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-empty-actions'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: { userDecision: 'edit' },
      }),
    ).toThrow(HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: { userDecision: 'edit', approvedActions: [] },
      }),
    ).toThrow(HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE);
  });

  it('edit/confirm tool and executed-status gates use named constants (residual 491)', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-edit-tool-const'),
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
              tool: 'create_goal',
              index: 0,
              dependsOn: [],
              rationale: 'wrong tool',
              payload: { title: 'Ok' },
            },
          ],
        },
      }),
    ).toThrow(HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_goal',
              status: 'executed',
              message: 'wrong',
              entityId: 'x',
            },
          ],
        },
      }),
    ).toThrow(HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE);

    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: {
          userDecision: 'confirm',
          executedActions: [
            {
              tool: 'create_task_template',
              status: 'failed',
              message: 'not executed',
              entityId: 'tpl-failed',
              data: { title: 'Ship residual 439' },
            },
          ],
        },
      }),
    ).toThrow(HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE);
  });

});


describe('edit draftAction sole product draft (residual 541)', () => {
  it('source uses draftAction after single-action + create_task_template gates', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(__dirname, '../host-task-create-resume.ts'),
      'utf8',
    );
    expect(src).toContain('Residual 541');
    expect(src).toContain('const draftAction = pendingActions[0]');
    expect(src).toContain("draftAction.tool !== 'create_task_template'");
    expect(src).toContain('...draftAction');
    // No blind multi-index invent after gates: title/name read draftAction payload only.
    const editIdx = src.indexOf("if (decision === 'edit')");
    expect(editIdx).toBeGreaterThan(-1);
    const editSlice = src.slice(editIdx, editIdx + 2200);
    expect(editSlice).toContain('draftAction.payload');
    expect(editSlice).not.toContain('pendingActions[1]');
  });
});

