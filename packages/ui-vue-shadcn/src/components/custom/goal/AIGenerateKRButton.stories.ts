import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIGenerateKRButton from './AIGenerateKRButton.vue';

const meta = {
  title: 'Business/Goal/AIGenerateKRButton',
  component: AIGenerateKRButton,
  tags: ['autodocs'],
  argTypes: {
    isGenerating: { control: 'boolean' },
    hasQuota: { control: 'boolean' },
  },
  args: {
    initialGoalTitle: '提升团队工作效率',
    initialGoalDescription: '通过优化流程和工具提升整体效率',
    hasQuota: true,
    isGenerating: false,
  },
} satisfies Meta<typeof AIGenerateKRButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithQuota: Story = {
  args: {
    quota: { remainingQuota: 8, quotaLimit: 10 },
    hasQuota: true,
    timeToReset: '6小时',
  },
};

export const QuotaExhausted: Story = {
  args: {
    quota: { remainingQuota: 0, quotaLimit: 10 },
    hasQuota: false,
    timeToReset: '2小时',
  },
};

export const Generating: Story = {
  args: {
    isGenerating: true,
    quota: { remainingQuota: 5, quotaLimit: 10 },
    hasQuota: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'AI 服务暂时不可用，请稍后重试',
    quota: { remainingQuota: 3, quotaLimit: 10 },
    hasQuota: true,
  },
};
