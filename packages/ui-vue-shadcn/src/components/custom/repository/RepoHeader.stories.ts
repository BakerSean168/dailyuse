import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoHeader from './RepoHeader.vue';

const meta = {
  title: 'Business/Repository/RepoHeader',
  component: RepoHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    modelValue: { description: '当前视图模式', control: 'select', options: ['preview', 'manage'] },
    debounceMs: { description: '搜索防抖延迟 (ms)', control: 'number' },
  },
} satisfies Meta<typeof RepoHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PreviewMode: Story = {
  args: {
    modelValue: 'preview',
    debounceMs: 300,
  },
};

export const ManageMode: Story = {
  args: {
    modelValue: 'manage',
    debounceMs: 300,
  },
};
