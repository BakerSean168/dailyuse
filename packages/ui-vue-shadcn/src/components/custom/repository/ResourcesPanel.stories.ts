import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourcesPanel from './ResourcesPanel.vue';

const now = Date.now();

const meta = {
  title: 'Business/Repository/ResourcesPanel',
  component: ResourcesPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    () => ({ template: '<div style="max-width: 600px;"><story /></div>' }),
  ],
  argTypes: {
    repositoryId: { description: '仓库 ID' },
    resources: { description: '资源列表' },
    isLoading: { description: '加载状态', control: 'boolean' },
  },
} satisfies Meta<typeof ResourcesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    repositoryId: 'repo-1',
    resources: [
      { id: 'r1', name: 'README.md', type: 'markdown', size: 2048, updatedAt: now, path: '/README.md' },
      { id: 'r2', name: 'architecture.png', type: 'image', size: 524288, updatedAt: now - 86400_000, path: '/images/architecture.png' },
      { id: 'r3', name: 'config.json', type: 'json', size: 512, updatedAt: now - 86400_000 * 7, path: '/config.json' },
    ],
    isLoading: false,
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
    isLoading: false,
  },
};

export const NoRepository: Story = {
  args: {
    repositoryId: null,
    resources: [],
    isLoading: false,
  },
};
