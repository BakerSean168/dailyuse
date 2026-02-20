import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BacklinkPanel from './BacklinkPanel.vue';

const meta = {
  title: 'Business/Editor/BacklinkPanel',
  component: BacklinkPanel,
  tags: ['autodocs'],
  argTypes: {
    documentId: { control: 'text' },
    autoLoad: { control: 'boolean' },
  },
  args: {
    documentId: 'doc-abc-123',
    autoLoad: false,
  },
} satisfies Meta<typeof BacklinkPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    documentId: 'doc-abc-123',
  },
};

export const AutoLoad: Story = {
  args: {
    documentId: 'doc-abc-123',
    autoLoad: true,
  },
};

export const EmptyDocument: Story = {
  args: {
    documentId: '',
    autoLoad: false,
  },
};
