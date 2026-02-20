import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagsPanel from './TagsPanel.vue';

const meta = {
  title: 'Business/Repository/TagsPanel',
  component: TagsPanel,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    loading: false,
    error: null,
  },
} satisfies Meta<typeof TagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockStatistics = [
  { tag: 'architecture', count: 12 },
  { tag: 'api', count: 8 },
  { tag: 'frontend', count: 15 },
  { tag: 'database', count: 6 },
  { tag: 'security', count: 4 },
  { tag: 'devops', count: 9 },
  { tag: 'testing', count: 7 },
  { tag: 'documentation', count: 11 },
];

const mockFilteredResources = [
  { id: 'res-1', title: 'System Architecture Overview', path: '/docs/architecture/overview.md', updatedAt: '2024-01-15T10:30:00Z' },
  { id: 'res-2', title: 'Microservices Design', path: '/docs/architecture/microservices.md', updatedAt: '2024-01-12T14:20:00Z' },
  { id: 'res-3', title: 'Database Schema Design', path: '/docs/architecture/database.md', updatedAt: '2024-01-10T09:00:00Z' },
];

export const Default: Story = {
  args: {
    statistics: mockStatistics,
  },
};

export const WithSelectedTag: Story = {
  args: {
    statistics: mockStatistics,
    selectedTag: 'architecture',
    filteredResources: mockFilteredResources,
  },
};

export const Loading: Story = {
  args: {
    statistics: [],
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    statistics: [],
    error: 'Failed to load tag statistics. Please try again.',
  },
};
