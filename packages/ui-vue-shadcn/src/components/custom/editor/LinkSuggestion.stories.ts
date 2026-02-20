import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkSuggestion from './LinkSuggestion.vue';

const meta = {
  title: 'Business/Editor/LinkSuggestion',
  component: LinkSuggestion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    visible: { description: '是否可见', control: 'boolean' },
    searchQuery: { description: '搜索关键词', control: 'text' },
    position: { description: '弹出位置', control: 'object' },
  },
} satisfies Meta<typeof LinkSuggestion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {
  args: { visible: true, searchQuery: '项目', position: { x: 200, y: 200 } },
};

export const Hidden: Story = {
  args: { visible: false, searchQuery: '', position: { x: 0, y: 0 } },
};
