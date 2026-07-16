import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { useTask } from '../../composables/useTask';
import DailyTodoWidget from './DailyTodoWidget.vue';

vi.mock('../../composables/useTask', () => ({
  useTask: vi.fn(),
}));

const PassThroughStub = defineComponent({
  template: '<div><slot /></div>',
});

function createInstance(status: TaskInstanceClientDTO['status']): TaskInstanceClientDTO {
  return {
    id: 'TaskInstanceId_today',
    templateId: 'TaskTemplateId_today',
    instanceDate: Date.now(),
    status,
    timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
  } as TaskInstanceClientDTO;
}

describe('DailyTodoWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes the home progress and completed statistics after completing today\'s task', async () => {
    const instances = ref<TaskInstanceClientDTO[]>([createInstance('Pending')]);
    const templates = ref<TaskTemplateClientDTO[]>([
      {
        id: 'TaskTemplateId_today',
        name: 'Close the daily loop',
      } as TaskTemplateClientDTO,
    ]);
    const completeInstance = vi.fn(async (id: string) => {
      instances.value = instances.value.map((instance) =>
        instance.id === id ? { ...instance, status: 'Completed' } : instance,
      );
      return instances.value.find((instance) => instance.id === id) ?? null;
    });

    vi.mocked(useTask).mockReturnValue({
      instances,
      templates,
      isLoading: ref(false),
      fetchInstancesByDateRange: vi.fn().mockResolvedValue(undefined),
      fetchTemplates: vi.fn().mockResolvedValue(undefined),
      completeInstance,
    } as unknown as ReturnType<typeof useTask>);

    const wrapper = mount(DailyTodoWidget, {
      global: {
        stubs: {
          Card: PassThroughStub,
          CardHeader: PassThroughStub,
          CardTitle: PassThroughStub,
          CardContent: PassThroughStub,
          ScrollArea: PassThroughStub,
          Button: PassThroughStub,
          Skeleton: true,
          ListTodo: true,
          ArrowRight: true,
          CheckCircle2: true,
          Check: true,
          Loader2: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('0/1');
    expect(wrapper.get('.h-full.rounded-full.bg-emerald-500').attributes('style')).toContain(
      'width: 0%',
    );

    await wrapper.get('button[title="标记完成"]').trigger('click');
    await flushPromises();

    expect(completeInstance).toHaveBeenCalledWith('TaskInstanceId_today');
    expect(wrapper.emitted('completed')).toEqual([
      [expect.objectContaining({ id: 'TaskInstanceId_today', status: 'Completed' })],
    ]);
    expect(wrapper.text()).toContain('1/1');
    expect(wrapper.get('.h-full.rounded-full.bg-emerald-500').attributes('style')).toContain(
      'width: 100%',
    );
    expect(wrapper.get('button[title="已完成"]').attributes('disabled')).toBeDefined();
  });
});
