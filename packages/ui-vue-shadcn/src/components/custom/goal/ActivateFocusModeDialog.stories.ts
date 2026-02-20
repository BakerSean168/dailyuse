import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ActivateFocusModeDialog from './ActivateFocusModeDialog.vue';

const mockGoals = [
  { id: 'goal-1', title: '提升编程能力' },
  { id: 'goal-2', title: '健康管理' },
  { id: 'goal-3', title: '完成项目重构' },
  { id: 'goal-4', title: '学习新技术栈' },
];

const meta = {
  title: 'Business/Goal/ActivateFocusModeDialog',
  component: ActivateFocusModeDialog,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { description: '对话框显示状态', control: 'boolean' },
    goals: { description: '可选目标列表', control: 'object' },
  },
} satisfies Meta<typeof ActivateFocusModeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { modelValue: true, goals: mockGoals },
};

export const NoGoals: Story = {
  args: { modelValue: true, goals: [] },
};
