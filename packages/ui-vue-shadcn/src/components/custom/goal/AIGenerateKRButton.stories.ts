import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIGenerateKRButton from './AIGenerateKRButton.vue';

const meta = {
  title: 'Business/Goal/AIGenerateKRButton',
  component: AIGenerateKRButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    initialGoalTitle: { description: '目标标题', control: 'text' },
    initialGoalDescription: { description: '目标描述', control: 'text' },
    initialStartDate: { description: '开始日期', control: 'text' },
    initialEndDate: { description: '结束日期', control: 'text' },
    isGenerating: { description: '生成中', control: 'boolean' },
    error: { description: '错误信息', control: 'text' },
    quota: { description: '剩余配额', control: 'number' },
    hasQuota: { description: '是否有配额', control: 'boolean' },
    timeToReset: { description: '配额重置时间', control: 'text' },
  },
} satisfies Meta<typeof AIGenerateKRButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialGoalTitle: '提升编程能力',
    initialGoalDescription: '通过系统学习和项目实践来提升编程技能',
    isGenerating: false,
    hasQuota: true,
    quota: 5,
  },
};

export const Generating: Story = {
  args: {
    initialGoalTitle: '提升编程能力',
    isGenerating: true,
    hasQuota: true,
    quota: 4,
  },
};

export const NoQuota: Story = {
  args: {
    initialGoalTitle: '提升编程能力',
    isGenerating: false,
    hasQuota: false,
    quota: 0,
    timeToReset: '2小时后',
  },
};

export const WithError: Story = {
  args: {
    initialGoalTitle: '提升编程能力',
    isGenerating: false,
    error: 'AI 服务暂时不可用，请稍后重试',
    hasQuota: true,
    quota: 5,
  },
};
