/** @vitest-environment jsdom */
import { computed, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReminderCapsulePreview from './ReminderCapsulePreview.vue';

const errorRef = ref<string | null>(null);
const getTodaySchedule = vi.fn();

vi.mock('../../../modules/reminder/composables/useReminder', () => ({
  useReminder: () => ({
    error: computed(() => errorRef.value),
    getTodaySchedule,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { capsule: { reminder: 'Reminder' } },
      shell: {
        enterModule: 'Enter',
        preview: { reminderEmpty: 'No remaining reminders today' },
      },
      common: { retry: 'Retry', operationFailed: 'failed' },
    },
  },
});

function mountPreview() {
  return mount(ReminderCapsulePreview, { global: { plugins: [i18n] } });
}

describe('ReminderCapsulePreview', () => {
  afterEach(() => {
    errorRef.value = null;
    vi.clearAllMocks();
  });

  it('renders remaining schedule items from getTodaySchedule().data', async () => {
    const future = Date.now() + 60_000;
    getTodaySchedule.mockResolvedValue({
      data: [
        {
          templateId: 'r1',
          title: 'Standup',
          description: 'daily',
          nextTriggerAt: future,
        },
      ],
    });
    const wrapper = mountPreview();
    await nextTick();
    await nextTick();
    expect(getTodaySchedule).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="reminder-capsule-item-r1"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="reminder-capsule-item-r1"]').text()).toContain('Standup');
    wrapper.unmount();
  });

  it('shows empty when only past items remain', async () => {
    getTodaySchedule.mockResolvedValue({
      data: [
        {
          templateId: 'r0',
          title: 'Past',
          nextTriggerAt: Date.now() - 60_000,
        },
      ],
    });
    const wrapper = mountPreview();
    await nextTick();
    await nextTick();
    expect(wrapper.find('[data-testid="reminder-capsule-empty"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
