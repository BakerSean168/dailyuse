import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import WeightSuggestionPanel from './WeightSuggestionPanel.vue';
import { createMockKeyResults } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Weight/WeightSuggestionPanel',
  component: WeightSuggestionPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '权重建议面板。通过 `open()` 方法打开，展示 AI 生成的权重分配策略。' } },
  },
  argTypes: {
    keyResults: { description: '关键结果列表', control: 'object' },
  },
} satisfies Meta<typeof WeightSuggestionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { keyResults: createMockKeyResults() as any },
  render: (args) => ({
    components: { WeightSuggestionPanel },
    setup() {
      const panelRef = ref<InstanceType<typeof WeightSuggestionPanel>>();
      const open = () => panelRef.value?.open();
      return { panelRef, open, args };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">查看权重建议</button><WeightSuggestionPanel ref="panelRef" v-bind="args" /></div>`,
  }),
};
