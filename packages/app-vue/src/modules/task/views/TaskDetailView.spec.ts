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

const templates = ref<TaskTemplateClientDTO[]>([template]);
const currentTemplate = ref<TaskTemplateClientDTO | null>(template);

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'template-a' } }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('../composables/useTask', () => ({
  useTask: () => ({
    templates,
    dependencies: ref([]),
    currentTemplate,
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
            goalName: 'Launch MemoFlow',
            keyResultName: 'Complete the product journey',
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
          dueInWindow: 'Due in the last {days} days',
          completedInWindow: 'Completed in window',
          noExecutionRecords: 'No execution records',
          oneTimeStatus: 'To-do status',
          edit: 'Edit',
        },
        templateCard: {
          noTags: 'No tags',
          noRecurrence: 'No recurrence',
          statusActive: 'Enabled',
          instanceStatusPending: 'Pending',
          instanceStatusInProgress: 'In progress',
          instanceStatusCompleted: 'Completed',
          instanceStatusSkipped: 'Skipped',
          instanceStatusExpired: 'Expired',
          instanceStatusNotGenerated: 'Not generated',
        },
        timeConfig: { allDay: 'All day' },
        metadata: { importanceMedium: 'Medium', selectColor: 'Select color' },
      },
    },
  },
});

describe('TaskDetailView goal binding', () => {
  beforeEach(() => {
    templates.value = [template];
    currentTemplate.value = template;
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

describe('TaskDetailView completion projection', () => {
  beforeEach(() => {
    fetchTemplate.mockClear();
    fetchTaskGraph.mockClear();
    loadGoalBinding.mockClear();
  });

  function mountDetail() {
    return mount(TaskDetailView, {
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
  }

  it('shows the canonical rolling window numerator, denominator, and percentage', async () => {
    currentTemplate.value = {
      ...template,
      recurrenceRule: {
        frequency: 'Daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
      },
      dueInstanceCount: 10,
      completedDueInstanceCount: 8,
      completionWindowDays: 30,
      completionRate: 80,
    };
    templates.value = [currentTemplate.value];

    const wrapper = mountDetail();
    await flushPromises();

    const stats = wrapper.get('[data-testid="task-detail-rolling-completion"]');
    expect(stats.text()).toContain('Due in the last 30 days');
    expect(stats.text()).toContain('10');
    expect(stats.text()).toContain('8');
    expect(stats.text()).toContain('80%');
  });

  it('shows a one-time to-do final status without a percentage', async () => {
    currentTemplate.value = {
      ...template,
      singleInstanceStatus: 'Completed',
      completionRate: 0,
    };
    templates.value = [currentTemplate.value];

    const wrapper = mountDetail();
    await flushPromises();

    const stats = wrapper.get('[data-testid="task-detail-one-time-status"]');
    expect(stats.text()).toContain('To-do status');
    expect(stats.text()).toContain('Completed');
    expect(stats.text()).not.toContain('%');
  });
});
