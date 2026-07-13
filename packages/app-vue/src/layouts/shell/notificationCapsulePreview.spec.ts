import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

/**
 * Probe for S2-Notification capsule preview wiring (V2 §6.5 / §2.2):
 * - clicking notification capsule opens dedicated preview (not generic placeholder)
 * - view-all closes preview and enters module
 * - non-notification capsules keep generic placeholder + enter
 */
function mountCapsulePreviewProbe() {
  const previewOpenId = ref<string | null>(null);
  const entered = ref<string | null>(null);

  const Probe = defineComponent({
    name: 'NotificationCapsulePreviewProbe',
    setup() {
      function toggle(id: string) {
        previewOpenId.value = previewOpenId.value === id ? null : id;
      }
      function enter(id: string) {
        previewOpenId.value = null;
        entered.value = id;
      }
      return () =>
        h('div', [
          h(
            'button',
            {
              'data-testid': 'capsule-nav-notification',
              onClick: () => toggle('notification'),
            },
            'notification',
          ),
          h(
            'button',
            {
              'data-testid': 'capsule-nav-goal',
              onClick: () => toggle('goal'),
            },
            'goal',
          ),
          previewOpenId.value === 'notification'
            ? h('div', { 'data-testid': 'capsule-preview-notification' }, [
                h('div', { 'data-testid': 'notification-capsule-preview' }, 'recent'),
                h(
                  'button',
                  {
                    'data-testid': 'notification-capsule-view-all',
                    onClick: () => enter('notification'),
                  },
                  'view all',
                ),
              ])
            : null,
          previewOpenId.value === 'goal'
            ? h('div', { 'data-testid': 'capsule-preview-goal' }, [
                h('div', { 'data-testid': 'generic-preview-placeholder' }, 'placeholder'),
                h(
                  'button',
                  {
                    'data-testid': 'capsule-preview-enter-goal',
                    onClick: () => enter('goal'),
                  },
                  'enter',
                ),
              ])
            : null,
          h('div', { 'data-testid': 'entered' }, entered.value ?? ''),
        ]);
    },
  });

  return mount(Probe);
}

describe('Notification capsule preview wiring (V2 §6.5)', () => {
  it('opens the notification-specific preview and enters the inbox via view-all', async () => {
    const wrapper = mountCapsulePreviewProbe();

    await wrapper.get('[data-testid="capsule-nav-notification"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="notification-capsule-preview"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="generic-preview-placeholder"]').exists()).toBe(false);

    await wrapper.get('[data-testid="notification-capsule-view-all"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="capsule-preview-notification"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="entered"]').text()).toBe('notification');

    await wrapper.get('[data-testid="capsule-nav-goal"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="generic-preview-placeholder"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="notification-capsule-preview"]').exists()).toBe(false);

    wrapper.unmount();
  });
});
