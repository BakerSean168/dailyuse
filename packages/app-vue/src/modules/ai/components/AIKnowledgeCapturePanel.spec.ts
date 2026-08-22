import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import AIKnowledgeCapturePanel from './AIKnowledgeCapturePanel.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { cancel: 'Cancel', edit: 'Edit' },
      aiAssistant: {
        errors: { workflowExecutionFailed: 'Execution failed' },
        chatPage: { workflow: { knowledgeCaptureAwaitingApprovalHint: 'Review note' } },
        dialogs: {
          agent: { retry: 'Retry' },
          automation: { confirm: 'Confirm', recoveryRetryReady: 'Fix the issue and retry.' },
        },
      },
    },
  },
});

describe('AIKnowledgeCapturePanel', () => {
  it('redacts raw knowledge persistence failure messages', () => {
    const wrapper = mount(AIKnowledgeCapturePanel, {
      global: { plugins: [i18n] },
      props: {
        toolMode: 'knowledge-capture',
        knowledgeCaptureRun: {
          runId: 'run-recovery',
          conversationId: 'conv-1',
          kind: 'knowledge.capture',
          status: 'suspended',
          createdAt: 1,
          updatedAt: 2,
          suspension: {
            type: 'recovery_required',
            message: 'token=internal-secret could not write note',
            retryable: true,
            failures: [
              {
                operation: 'knowledge_note',
                code: 'WRITE_FAILED',
                message: 'token=internal-secret could not write note',
                retryable: true,
              },
            ],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Fix the issue and retry.');
    expect(wrapper.text()).toContain('Execution failed (WRITE_FAILED)');
    expect(wrapper.text()).not.toContain('internal-secret');
  });
});
