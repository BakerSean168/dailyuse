import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { RadioGroup, RadioGroupItem } from '@memoflow/ui-vue-shadcn';

describe('RadioGroup accessibility', () => {
  it('does not nest hidden native radios inside interactive radio controls', async () => {
    const Host = defineComponent({
      setup() {
        const selected = ref('AllDay');
        return () =>
          h('form', [
            h(
              RadioGroup,
              {
                modelValue: selected.value,
                'aria-label': 'Time type',
                'onUpdate:modelValue': (value: unknown) => {
                  selected.value = String(value);
                },
              },
              {
                default: () => [
                  h(RadioGroupItem, { id: 'all-day', value: 'AllDay' }),
                  h('label', { for: 'all-day' }, 'All day'),
                  h(RadioGroupItem, { id: 'time-point', value: 'TimePoint' }),
                  h('label', { for: 'time-point' }, 'Time point'),
                ],
              },
            ),
          ]);
      },
    });

    const wrapper = mount(Host, { attachTo: document.body });

    expect(wrapper.findAll('[role="radio"] input[type="radio"]')).toHaveLength(0);
    await wrapper.get('#time-point').trigger('click');
    expect(wrapper.get('#time-point').attributes('aria-checked')).toBe('true');

    wrapper.unmount();
  });
});
