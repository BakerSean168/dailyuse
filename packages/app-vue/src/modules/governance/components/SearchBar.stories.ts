import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SearchBar from './SearchBar.vue';

const meta = {
  title: 'Business/Governance/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    modelValue: { description: '搜索文本', control: 'text' },
    debounceMs: { description: '防抖延迟（毫秒）', control: 'number' },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: '',
    debounceMs: 300,
  },
};

export const WithQuery: Story = {
  args: {
    modelValue: '代码规范',
    debounceMs: 300,
  },
};

export const FastDebounce: Story = {
  args: {
    modelValue: '',
    debounceMs: 100,
  },
};
