import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GovernanceSearchBar from './GovernanceSearchBar.vue';

const meta = {
  title: 'Business/Governance/GovernanceSearchBar',
  component: GovernanceSearchBar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    modelValue: { description: '搜索文本', control: 'text' },
    debounceMs: { description: '防抖延迟（毫秒）', control: 'number' },
  },
} satisfies Meta<typeof GovernanceSearchBar>;

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
