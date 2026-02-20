import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourcesPanel from './ResourcesPanel.vue';

const meta = {
  title: 'Business/Repository/ResourcesPanel',
  component: ResourcesPanel,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
  },
  args: {
    isLoading: false,
  },
} satisfies Meta<typeof ResourcesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockResources = [
  {
    id: 'res-1',
    name: 'Architecture Overview.md',
    type: 'markdown',
    size: 8192,
    updatedAt: Date.now() - 3600000,
    path: '/docs/Architecture Overview.md',
  },
  {
    id: 'res-2',
    name: 'system-diagram.png',
    type: 'image',
    size: 2097152,
    updatedAt: Date.now() - 86400000,
    path: '/assets/system-diagram.png',
  },
  {
    id: 'res-3',
    name: 'Meeting Notes Jan 2024.md',
    type: 'markdown',
    size: 4096,
    updatedAt: Date.now() - 172800000,
    path: '/notes/Meeting Notes Jan 2024.md',
  },
  {
    id: 'res-4',
    name: 'API Spec.yaml',
    type: 'yaml',
    size: 16384,
    updatedAt: Date.now() - 259200000,
    path: '/specs/API Spec.yaml',
  },
];

export const Default: Story = {
  args: {
    repositoryId: 'repo-1',
    resources: mockResources,
  },
};

export const Loading: Story = {
  args: {
    repositoryId: 'repo-1',
    resources: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    repositoryId: 'repo-1',
    resources: [],
  },
};

export const SingleResource: Story = {
  args: {
    repositoryId: 'repo-1',
    resources: [mockResources[0]],
  },
};
