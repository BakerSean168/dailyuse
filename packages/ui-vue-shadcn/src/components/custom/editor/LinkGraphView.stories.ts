import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkGraphView from './LinkGraphView.vue';

const meta = {
  title: 'Business/Editor/LinkGraphView',
  component: LinkGraphView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="height: 500px;"><story /></div>' })],
  argTypes: {
    documentId: { description: '文档 ID', control: 'text' },
    initialDepth: { description: '初始深度', control: { type: 'range', min: 1, max: 3 } },
  },
} satisfies Meta<typeof LinkGraphView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { documentId: 'doc-1', initialDepth: 2 },
};

export const ShallowDepth: Story = {
  args: { documentId: 'doc-1', initialDepth: 1 },
};
