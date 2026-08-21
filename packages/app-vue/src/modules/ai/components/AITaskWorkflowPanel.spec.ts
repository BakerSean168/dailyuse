import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import AITaskWorkflowPanel from './AITaskWorkflowPanel.vue';

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { cancel: 'Cancel', edit: 'Edit' }, aiAssistant: { chatPage: { workflow: { taskAwaitingApprovalHint: 'Review task' } }, dialogs: { agent: { warnings: 'Warnings', retry: 'Retry' }, automation: { confirm: 'Confirm' } } } } } });
describe('AITaskWorkflowPanel', () => {
  it('renders task draft title, status, and revision', () => {
    const wrapper = mount(AITaskWorkflowPanel, { global: { plugins: [i18n] }, props: { toolMode: 'task-create', taskWorkflowRun: { runId: 'run-1', conversationId: 'conv-1', kind: 'task.create', status: 'suspended', createdAt: 1, updatedAt: 1, suspension: { type: 'task_draft_review', draft: { revision: 2, task: { title: 'Ship it', description: '', importance: 'Moderate', cadence: 'once', startDate: null, timeOfDay: '09:00', daysOfWeek: [], occurrences: null, goalId: null, keyResultId: null, folderId: null, tags: [] }, rationale: 'Do it', warnings: [] }, warnings: [], revision: 2 } } } });
    expect(wrapper.find('[data-testid="task-workflow-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Ship it');
    expect(wrapper.find('[data-testid="task-workflow-revision"]').text()).toContain('2');
  });
});
