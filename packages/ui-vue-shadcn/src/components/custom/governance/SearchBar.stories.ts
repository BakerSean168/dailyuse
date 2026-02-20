import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SearchBar from './SearchBar.vue';

const meta = {
  title: 'Business/Governance/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    debounceMs: { control: 'number' },
  },
  args: {
    modelValue: '',
    debounceMs: 300,
  },
  decorators: [() => ({ template: '<div class="max-w-md p-4"><story /></div>' })],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithValue: Story = {
  args: {
    modelValue: 'typescript strict',
  },
};

export const FastDebounce: Story = {
  args: {
    debounceMs: 100,
  },
};

export const SlowDebounce: Story = {
  args: {
    debounceMs: 1000,
  },
};
