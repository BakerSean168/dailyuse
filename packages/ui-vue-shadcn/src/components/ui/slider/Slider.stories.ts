import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Slider } from '.';
import { ref } from 'vue';

const meta = {
  title: 'Atoms/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Slider },
    setup() {
      const value = ref([33]);
      return { value };
    },
    template: '<Slider v-model="value" :max="100" :step="1" class="w-[60%]" />',
  }),
};

export const Range: Story = {
  render: () => ({
    components: { Slider },
    setup() {
      const value = ref([25, 75]);
      return { value };
    },
    template: '<Slider v-model="value" :max="100" :step="1" class="w-[60%]" />',
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { Slider },
    template: '<Slider :default-value="[50]" :max="100" :step="1" disabled class="w-[60%]" />',
  }),
};
