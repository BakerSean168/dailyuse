import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorToolbar from './EditorToolbar.vue';

const meta = {
  title: 'Business/Editor/EditorToolbar',
  component: EditorToolbar,
  tags: ['autodocs'],
  argTypes: {
    saving: { control: 'boolean' },
  },
  args: {
    saving: false,
  },
} satisfies Meta<typeof EditorToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    saving: false,
  },
};

export const Saving: Story = {
  args: {
    saving: true,
  },
};
