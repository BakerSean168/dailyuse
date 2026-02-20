import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIKeyResultsSection from './AIKeyResultsSection.vue';

const meta = {
  title: 'Business/Goal/AIKeyResultsSection',
  component: AIKeyResultsSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    goalTitle: { description: '目标标题', control: 'text' },
    goalDescription: { description: '目标描述', control: 'text' },
  },
} satisfies Meta<typeof AIKeyResultsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    goalTitle: '提升团队工作效率',
    goalDescription: '通过流程优化和工具引入来提升团队整体效率',
  },
};

export const WithoutDescription: Story = {
  args: {
    goalTitle: '学习新技术',
  },
};
