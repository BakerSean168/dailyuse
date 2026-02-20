import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import WeightSuggestionPanel from './WeightSuggestionPanel.vue';

const mockKeyResults = [
  { id: 'kr1', title: '月活用户达到 50,000', weight: 40, progress: 80, currentValue: 40000, targetValue: 50000 },
  { id: 'kr2', title: '客户满意度 ≥ 4.5', weight: 30, progress: 60, currentValue: 4.2, targetValue: 4.5 },
  { id: 'kr3', title: '平均响应时间 ≤ 200ms', weight: 30, progress: 42, currentValue: 350, targetValue: 200 },
];

const meta = {
  title: 'Business/Goal/Weight/WeightSuggestionPanel',
  component: WeightSuggestionPanel,
  tags: ['autodocs'],
  args: {
    keyResults: mockKeyResults,
  },
} satisfies Meta<typeof WeightSuggestionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { WeightSuggestionPanel },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<WeightSuggestionPanel v-bind="args" v-model="open" />',
  }),
};

export const ManyKeyResults: Story = {
  render: (args) => ({
    components: { WeightSuggestionPanel },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<WeightSuggestionPanel v-bind="args" v-model="open" />',
  }),
  args: {
    keyResults: [
      ...mockKeyResults,
      { id: 'kr4', title: '代码覆盖率 ≥ 85%', weight: 20, progress: 70, currentValue: 78, targetValue: 85 },
      { id: 'kr5', title: '文档完善度 100%', weight: 10, progress: 55, currentValue: 55, targetValue: 100 },
    ],
  },
};

export const SingleKeyResult: Story = {
  render: (args) => ({
    components: { WeightSuggestionPanel },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<WeightSuggestionPanel v-bind="args" v-model="open" />',
  }),
  args: {
    keyResults: [mockKeyResults[0]],
  },
};
