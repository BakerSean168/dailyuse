import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BacklinkPanel from './BacklinkPanel.vue';

const meta = {
  title: 'Business/Editor/BacklinkPanel',
  component: BacklinkPanel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 320px;"><story /></div>' })],
  argTypes: {
    documentId: { description: '当前文档 ID', control: 'text' },
    autoLoad: { description: '自动加载', control: 'boolean' },
  },
} satisfies Meta<typeof BacklinkPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { documentId: 'doc-1', autoLoad: true },
};

export const NoAutoLoad: Story = {
  args: { documentId: 'doc-2', autoLoad: false },
};
