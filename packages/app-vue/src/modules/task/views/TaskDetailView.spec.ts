import { defineComponent, h, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import TaskDetailView from './TaskDetailView.vue';

const fetchTemplate = vi.fn().mockResolvedValue(undefined);
const fetchTaskGraph = vi.fn().mockResolvedValue(undefined);
const loadGoalBinding = vi.fn().mockResolvedValue(undefined);

const template = {
  id: 'template-a',
  identityId: 'identity-a',
  name: 'Ship the product review',
  description: 'Close the core loop',
  timeConfig: { timeType: 'AllDay', startDate: Date.now() },
  recurrenceRule: null,
  reminderConfig: null,
  importance: 'Moderate',
  goalBinding: {
    goalId: 'goal-a',
    keyResultId: 'kr-a',
    goalRecordValue: 1,
    progressTrigger: 'PER_INSTANCE',
  },
  folderId: null,
  tags: [],
  color: null,
  status: 'Active',
  lastGeneratedDate: null,
  generateAheadDays: null,
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  parentTaskId: null,
  startDate: Date.now(),
  dueDate: null,
  completedAt: null,
  estimatedMinutes: null,
  actualMinutes: null,
  comment: null,
  blockingReason: null,
  instanceCount: 1,
  completedInstanceCount: 0,
  pendingInstanceCount: 1,
  completionRate: 0,
} as TaskTemplateClientDTO;

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'template-a' } }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('../composables/useTask', () => ({
  useTask: () => ({
    templates: ref([template]),
    dependencies: ref([]),
    currentTemplate: ref(template),
    isLoading: ref(false),
    isSaving: ref(false),
    fetchTemplate,
    fetchTaskGraph,
    updateTemplate: vi.fn(),
    createDependency: vi.fn(),
    deleteDependency: vi.fn(),
  }),
}));

vi.mock('../composables/useTaskGoalBindingOptions', () => ({
  useTaskGoalBindingOptions: () => ({
    loadGoalBinding,
    resolveGoalBinding: (binding: TaskTemplateClientDTO['goalBinding']) =>
      binding
        ? {
            goalId: binding.goalId,
            keyResultId: binding.keyResultId,
            incrementValue: binding.goalRecordValue,
            progressTrigger: binding.progressTrigger,
            goalTitle: 'Launch MemoFlow',
            keyResultTitle: 'Complete the product journey',
          }
        : null,
  }),
}));

const passThrough = (name: string, tag = 'div') =>
  defineComponent({
    name,
    setup(_props, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { back: 'Back', none: 'None', unknown: 'Unknown' },
      task: {
        detail: {
          title: 'Task plan details',
          loading: 'Loading',
          notFound: 'Not found',
          basicInfo: 'Basic information',
          importance: 'Importance',
          priority: 'Priority',
          createTime: 'Created',
          updateTime: 'Updated',
          templateStartDate: 'Start date',
          timeType: 'Time type',
          timeValue: 'Time',
          description: 'Description',
          tags: 'Tags',
          goalBinding: 'Goal contribution',
          linkedGoal: 'Goal',
          keyResult: 'Key result',
          relations: 'Relations',
          parentTask: 'Parent task',
          noParentTask: 'No parent task',
          dependencyStatus: 'Dependency status',
          readyState: 'Ready',
          subtasks: 'Subtasks',
          noSubtasks: 'No subtasks',
          predecessors: 'Predecessors',
          noPredecessors: 'No predecessors',
          successors: 'Successors',
          noSuccessors: 'No successors',
          executionStats: 'Execution statistics',
          totalInstances: 'Total',
          completed: 'Completed',
          completionRate: 'Completion rate',
          edit: 'Edit',
        },
        templateCard: { noTags: 'No tags', noRecurrence: 'No recurrence', statusActive: 'Enabled' },
        timeConfig: { allDay: 'All day' },
        metadata: { importanceMedium: 'Medium', selectColor: 'Select color' },
      },
    },
  },
});

describe('TaskDetailView goal binding', () => {
  beforeEach(() => {
    fetchTemplate.mockClear();
    fetchTaskGraph.mockClear();
    loadGoalBinding.mockClear();
  });

  it('loads and shows the bound goal and key result names', async () => {
    const wrapper = mount(TaskDetailView, {
      global: {
        plugins: [i18n],
        stubs: {
          Button: passThrough('Button', 'button'),
          Badge: passThrough('Badge', 'span'),
          Separator: passThrough('Separator'),
          Card: passThrough('Card'),
          CardHeader: passThrough('CardHeader'),
          CardTitle: passThrough('CardTitle', 'h2'),
          CardContent: passThrough('CardContent'),
          TaskTemplateDialog: true,
          ArrowLeft: true,
          FileQuestion: true,
          Pencil: true,
        },
      },
    });

    await flushPromises();

    expect(loadGoalBinding).toHaveBeenCalledWith('goal-a');
    expect(wrapper.get('[data-testid="task-goal-binding"]')).toBeTruthy();
    expect(wrapper.text()).toContain('Launch MemoFlow');
    expect(wrapper.text()).toContain('Complete the product journey');
  });
});
