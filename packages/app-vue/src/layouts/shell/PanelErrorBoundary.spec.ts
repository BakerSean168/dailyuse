import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PanelErrorBoundary from './PanelErrorBoundary.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: {
        unknownError: 'Unknown error',
        retry: 'Retry',
        viewErrorDetails: 'View error details',
      },
      shell: {
        panel: {
          contentErrorTitle: 'This panel ran into a problem',
          contentErrorDescription: 'This business panel failed to render.',
        },
      },
    },
  },
});

const Healthy = defineComponent({
  setup() {
    return () => h('div', { 'data-testid': 'panel-ok' }, 'ok');
  },
});

describe('PanelErrorBoundary (V2 S5 cleanup)', () => {
  it('renders children when healthy', () => {
    const wrapper = mount(PanelErrorBoundary, {
      global: { plugins: [i18n] },
      slots: { default: () => h(Healthy) },
    });

    expect(wrapper.get('[data-testid="panel-ok"]').text()).toBe('ok');
    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="panel-error-content"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows fallback UI when an error is reported and hides content', async () => {
    const wrapper = mount(PanelErrorBoundary, {
      global: { plugins: [i18n] },
      slots: { default: () => h(Healthy) },
    });

    const vm = wrapper.vm as unknown as {
      reportError: (err: unknown) => void;
      error: { value: Error | null };
    };
    vm.reportError(new Error('panel boom'));
    await nextTick();

    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="panel-error-fallback"]').text()).toContain(
      'This panel ran into a problem',
    );
    expect(wrapper.get('[data-testid="panel-error-fallback"]').text()).toContain('panel boom');
    expect(wrapper.find('[data-testid="panel-ok"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="panel-error-content"]').attributes('style')).toContain(
      'display: none',
    );
    wrapper.unmount();
  });

  it('retry clears the error without unmounting the routed draft subtree', async () => {
    const wrapper = mount(PanelErrorBoundary, {
      global: { plugins: [i18n] },
      slots: { default: () => h(Healthy) },
    });

    const vm = wrapper.vm as unknown as {
      reportError: (err: unknown) => void;
      handleRetry: () => void;
      contentKey: number;
    };

    vm.reportError(new Error('panel boom'));
    await nextTick();
    const keyBefore = Number(vm.contentKey);
    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(true);

    await wrapper.get('[data-testid="panel-error-retry"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="panel-ok"]').text()).toBe('ok');
    expect(Number(vm.contentKey)).toBe(keyBefore + 1);
    wrapper.unmount();
  });

  it('resets when resetKey changes while in error state', async () => {
    const Host = defineComponent({
      components: { PanelErrorBoundary, Healthy },
      setup() {
        const resetKey = ref<string | null>('tab-a');
        return { resetKey };
      },
      template: `
        <PanelErrorBoundary ref="boundary" :reset-key="resetKey">
          <Healthy />
        </PanelErrorBoundary>
      `,
    });

    const wrapper = mount(Host, { global: { plugins: [i18n] } });
    const boundary = wrapper.findComponent(PanelErrorBoundary);
    const vm = boundary.vm as unknown as {
      reportError: (err: unknown) => void;
      contentKey: number;
    };

    vm.reportError(new Error('panel boom'));
    await nextTick();
    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(true);
    const keyBefore = Number(vm.contentKey);

    (wrapper.vm as { resetKey: string }).resetKey = 'tab-b';
    await nextTick();

    expect(wrapper.find('[data-testid="panel-error-fallback"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="panel-ok"]').text()).toBe('ok');
    expect(Number(vm.contentKey)).toBe(keyBefore + 1);
    wrapper.unmount();
  });
});
