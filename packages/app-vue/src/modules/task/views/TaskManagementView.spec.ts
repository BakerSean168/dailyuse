import { defineComponent, h, reactive, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskType } from '@memoflow/contracts/task';
import type { TaskTemplateViewModel } from '../components/types';
import { startOfDayMs } from '../../../shared/utils/product-time';
import TaskManagementView from './TaskManagementView.vue';
import { useAppShellStore } from '../../../layouts/shell/useAppShellStore';

const templates = ref<Record<string, unknown>[]>([]);
const dependencies = ref([]);
const createTemplate = vi.fn();
const loadGoalBindings = vi.fn().mockResolvedValue(undefined);
const routerPush = vi.fn();
const routerReplace = vi.fn().mockResolvedValue(undefined);
const route = reactive({ path: '/tasks', query: {} as Record<string, string> });

const mappedTemplate: TaskTemplateViewModel = {
  id: 'template-1',
  title: 'Existing plan',
  status: 'ACTIVE',
  timeConfig: { timeType: 'AllDay', startDate: 1 },
  recurrenceRule: null,
};

vi.mock('../composables/useTaskTemplateGraphQuery', () => ({
  useTaskTemplateGraphQuery: () => ({
    templates,
    dependencies,
    isLoading: ref(false),
    refetch: vi.fn(),
  }),
}));

vi.mock('../composables/useTaskTemplateMutations', () => ({
  useTaskTemplateMutations: () => ({
    isSaving: ref(false),
    createTemplateSafe: createTemplate,
    updateTemplateSafe: vi.fn(),
    deleteTemplateSafe: vi.fn(),
    deleteTemplatesSafe: vi.fn(),
    activateTemplateSafe: vi.fn(),
    pauseTemplateSafe: vi.fn(),
  }),
}));

vi.mock('../composables/useTaskDependencies', () => ({
  useTaskDependencies: () => ({
    createDependency: vi.fn(),
    deleteDependency: vi.fn(),
  }),
}));

vi.mock('../composables/useTaskGoalBindingOptions', () => ({
  useTaskGoalBindingOptions: () => ({
    loadGoalBindings,
    resolveGoalBinding: (binding: unknown) => binding,
  }),
}));

vi.mock('../utils/task-template-presentation', () => ({
  mapTaskTemplateDtoToViewModel: () => mappedTemplate,
  toTaskTimeConfigPayload: (value: unknown) => value,
}));

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

const passThrough = (name: string, tag = 'div') =>
  defineComponent({
    name,
    setup(_props, { slots, attrs }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });

const componentStub = (name: string, props: string[] = []) =>
  defineComponent({
    name,
    props,
    emits: [
      'save',
      'cancel',
      'copy-template',
      'edit-template',
      'delete-template',
      'pause-template',
      'resume-template',
      'click-template',
      'relation-filter-click',
      'locate-graph',
      'clear-filters',
      'ai-generate',
      'update:modelValue',
      'dirty-change',
    ],
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      common: {
        all: '全部',
        more: '更多',
      },
      task: {
        templateMgmt: {
          quickCreate: '快速任务',
          createNew: '新建任务计划',
          countLabel: '共 {count} 个任务计划',
          statusActive: '已启用',
          statusPaused: '已暂停',
          statusArchived: '已结束',
          relationAll: '全部',
          relationBlocked: '受阻',
          relationParented: '子任务',
          relationDependencies: '依赖',
          relationChildren: '含子任务',
          noActive: '暂无',
          deleteAll: '全部删除',
          confirmText: '确认删除 {count} 个任务计划',
          confirmDeleteAll: '删除全部任务计划',
          cannotUndo: '无法撤销',
          inputDeletePlaceholder: '输入 DELETE',
          cancel: '取消',
          confirmDeleteAllBtn: '确认删除',
        },
      },
    },
  },
});

function mountView() {
  return mount(TaskManagementView, {
    global: {
      plugins: [i18n, createPinia()],
      stubs: {
        Button: passThrough('Button', 'button'),
        TaskFilterBar: componentStub('TaskFilterBar'),
        TaskTemplateGrid: componentStub('TaskTemplateGrid', ['templates']),
        TaskDAGVisualization: componentStub('TaskDAGVisualization'),
        QuickTaskDialog: componentStub('QuickTaskDialog', ['modelValue', 'saving']),
        TaskTemplateDialog: componentStub('TaskTemplateDialog', [
          'modelValue',
          'mode',
          'template',
          'saving',
        ]),
        DropdownMenu: passThrough('DropdownMenu'),
        DropdownMenuTrigger: passThrough('DropdownMenuTrigger'),
        DropdownMenuContent: passThrough('DropdownMenuContent'),
        DropdownMenuItem: passThrough('DropdownMenuItem'),
        Dialog: passThrough('Dialog'),
        DialogContent: passThrough('DialogContent'),
        DialogHeader: passThrough('DialogHeader'),
        DialogTitle: passThrough('DialogTitle'),
        DialogFooter: passThrough('DialogFooter'),
        Alert: passThrough('Alert'),
        AlertDescription: passThrough('AlertDescription'),
        Input: passThrough('Input', 'input'),
        Label: passThrough('Label', 'label'),
        Zap: true,
        Plus: true,
        MoreHorizontal: true,
        Trash2: true,
        AlertCircle: true,
      },
    },
  });
}

describe('TaskManagementView task creation semantics', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    templates.value = [];
    createTemplate.mockReset().mockResolvedValue({ template: mappedTemplate });
    loadGoalBindings.mockClear();
    routerPush.mockClear();
    routerReplace.mockClear();
    route.query = {};
    vi.useRealTimers();
  });

  it('exposes separate primary quick-task and task-plan creation entries', () => {
    const wrapper = mountView();

    expect(wrapper.get('[data-testid="quick-task-button"]').attributes('aria-label')).toBe(
      '快速任务',
    );
    expect(
      wrapper.get('[data-testid="create-task-template-button"]').attributes('aria-label'),
    ).toBe('新建任务计划');
  });

  it('opens the quick-task dialog from the shell Home deep link', async () => {
    route.query = { dialog: 'quick-task' };
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.findComponent({ name: 'QuickTaskDialog' }).props('modelValue')).toBe(true);
  });

  it('publishes real dialog dirty state to the shell instead of treating open as dirty', async () => {
    const wrapper = mountView();
    const shell = useAppShellStore();

    await wrapper.get('[data-testid="create-task-template-button"]').trigger('click');
    expect(shell.surfaceStatus).toBe('clean');

    wrapper.findComponent({ name: 'TaskTemplateDialog' }).vm.$emit('dirty-change', true);
    await flushPromises();
    expect(shell.surfaceStatus).toBe('dirty');

    wrapper.findComponent({ name: 'TaskTemplateDialog' }).vm.$emit('dirty-change', false);
    await flushPromises();
    expect(shell.surfaceStatus).toBe('clean');
  });

  it('creates a quick task as a one-time all-day pending task for today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T14:30:00.000Z'));
    const wrapper = mountView();

    await wrapper.get('[data-testid="quick-task-button"]').trigger('click');
    wrapper.findComponent({ name: 'QuickTaskDialog' }).vm.$emit('save', {
      title: 'Prepare release notes',
    });
    await flushPromises();

    expect(createTemplate).toHaveBeenCalledWith(
      {
        name: 'Prepare release notes',
        description: null,
        taskType: TaskType.OneTime,
        timeConfig: {
          timeType: 'AllDay',
          startDate: startOfDayMs(Date.now()),
          timePoint: null,
          timeRange: null,
        },
        recurrenceRule: null,
        reminderConfig: null,
        importance: ImportanceLevel.Moderate,
        parentTaskId: null,
        folderId: null,
        tags: [],
        color: null,
        goalBinding: null,
      },
      'quick',
    );
  });

  it('opens the explicit copy flow in copy mode', async () => {
    templates.value = [{ id: mappedTemplate.id }];
    const wrapper = mountView();
    await flushPromises();

    wrapper
      .findComponent({ name: 'TaskTemplateGrid' })
      .vm.$emit('copy-template', mappedTemplate.id);
    await flushPromises();

    const copyDialog = wrapper
      .findAllComponents({ name: 'TaskTemplateDialog' })
      .find((dialog) => dialog.props('mode') === 'copy');
    expect(copyDialog?.props('template')).toMatchObject(mappedTemplate);
    expect(copyDialog?.props('modelValue')).toBe(true);
  });
});
