import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIKeyResultsSection from './AIKeyResultsSection.vue';

const meta = {
  title: 'Business/Goal/AIKeyResultsSection',
  component: AIKeyResultsSection,
  tags: ['autodocs'],
  args: {
    goalTitle: '提升团队季度交付效率',
    goalDescription: '通过优化流程、工具和协作方式提升整体交付效率',
  },
  decorators: [() => ({ template: '<div style="max-width: 800px;"><story /></div>' })],
} satisfies Meta<typeof AIKeyResultsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithoutGoalInfo: Story = {
  args: {
    goalTitle: undefined,
    goalDescription: undefined,
  },
};

export const WithCallbacks: Story = {
  args: {
    goalTitle: '优化客户满意度',
    goalDescription: '提升 NPS 得分和客户留存率',
    onSuccess: (msg: string) => console.log('Success:', msg),
    onError: (msg: string) => console.error('Error:', msg),
  },
};
