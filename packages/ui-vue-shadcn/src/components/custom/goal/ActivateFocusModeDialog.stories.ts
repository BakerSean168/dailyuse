import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ActivateFocusModeDialog from './ActivateFocusModeDialog.vue';

const mockGoals = [
  { id: 'g1', title: '提升团队季度交付效率' },
  { id: 'g2', title: '优化系统性能指标' },
  { id: 'g3', title: '完善产品用户体验' },
  { id: 'g4', title: '建立数据驱动决策体系' },
];

const meta = {
  title: 'Business/Goal/ActivateFocusModeDialog',
  component: ActivateFocusModeDialog,
  tags: ['autodocs'],
  args: {
    goals: mockGoals,
  },
} satisfies Meta<typeof ActivateFocusModeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { ActivateFocusModeDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<ActivateFocusModeDialog v-bind="args" v-model="open" />',
  }),
};

export const NoGoals: Story = {
  render: (args) => ({
    components: { ActivateFocusModeDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<ActivateFocusModeDialog v-bind="args" v-model="open" />',
  }),
  args: {
    goals: [],
  },
};

export const ManyGoals: Story = {
  render: (args) => ({
    components: { ActivateFocusModeDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<ActivateFocusModeDialog v-bind="args" v-model="open" />',
  }),
  args: {
    goals: [
      ...mockGoals,
      { id: 'g5', title: '拓展海外市场业务' },
      { id: 'g6', title: '降低运营成本 20%' },
      { id: 'g7', title: '提升员工满意度' },
    ],
  },
};
