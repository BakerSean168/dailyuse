import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoHeader from './RepoHeader.vue';

const meta = {
  title: 'Business/Repository/RepoHeader',
  component: RepoHeader,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'select', options: ['preview', 'manage'] },
    debounceMs: { control: 'number' },
  },
  args: {
    modelValue: 'preview',
    debounceMs: 300,
  },
} satisfies Meta<typeof RepoHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PreviewMode: Story = {
  args: {
    modelValue: 'preview',
  },
};

export const ManageMode: Story = {
  args: {
    modelValue: 'manage',
  },
};

export const CustomDebounce: Story = {
  args: {
    modelValue: 'preview',
    debounceMs: 500,
  },
};
