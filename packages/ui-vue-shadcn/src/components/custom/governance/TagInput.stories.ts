import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagInput from './TagInput.vue';

const meta = {
  title: 'Business/Governance/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  argTypes: {
    tags: { control: 'object' },
    suggestions: { control: 'object' },
    label: { control: 'text' },
    hint: { control: 'text' },
  },
  decorators: [() => ({ template: '<div class="max-w-md p-4"><story /></div>' })],
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    tags: [],
  },
};

export const WithTags: Story = {
  args: {
    tags: ['typescript', 'api', 'database'],
  },
};

export const WithSuggestions: Story = {
  args: {
    tags: ['typescript'],
    suggestions: ['api', 'database', 'testing', 'architecture', 'naming', 'config'],
  },
};

export const CustomLabel: Story = {
  args: {
    tags: ['urgent', 'review-needed'],
    label: 'Categories',
    hint: 'Add categories to organize rules',
  },
};

export const ManyTags: Story = {
  args: {
    tags: [
      'typescript',
      'api',
      'database',
      'testing',
      'architecture',
      'naming',
      'config',
      'security',
    ],
  },
};
