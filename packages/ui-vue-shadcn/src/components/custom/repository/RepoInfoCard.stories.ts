import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoInfoCard from './RepoInfoCard.vue';

const meta = {
  title: 'Business/Repository/RepoInfoCard',
  component: RepoInfoCard,
  tags: ['autodocs'],
  argTypes: {
    updateLabel: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof RepoInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    repository: {
      name: 'Knowledge Base',
      description: 'A comprehensive collection of research notes and technical documentation.',
      updatedAt: Date.now() - 3600000,
    },
  },
};

export const WithCustomLabel: Story = {
  args: {
    repository: {
      name: 'Project Docs',
      description: 'Internal project documentation and meeting notes.',
      updatedAt: Date.now() - 86400000,
    },
    updateLabel: 'Last synced',
  },
};

export const MinimalInfo: Story = {
  args: {
    repository: {
      name: 'New Repository',
    },
  },
};
