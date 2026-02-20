import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagFilterChips from './TagFilterChips.vue';

const meta = {
  title: 'Business/Governance/TagFilterChips',
  component: TagFilterChips,
  tags: ['autodocs'],
  argTypes: {
    tags: { control: 'object' },
    selectedTags: { control: 'object' },
  },
  decorators: [() => ({ template: '<div class="max-w-lg p-4"><story /></div>' })],
} satisfies Meta<typeof TagFilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

const allTags = ['typescript', 'api', 'database', 'testing', 'architecture', 'naming'];

export const NoneSelected: Story = {
  args: {
    tags: allTags,
    selectedTags: [],
  },
};

export const SomeSelected: Story = {
  args: {
    tags: allTags,
    selectedTags: ['typescript', 'api'],
  },
};

export const AllSelected: Story = {
  args: {
    tags: allTags,
    selectedTags: [...allTags],
  },
};

export const SingleTag: Story = {
  args: {
    tags: ['typescript'],
    selectedTags: ['typescript'],
  },
};
