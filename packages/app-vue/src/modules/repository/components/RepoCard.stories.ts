import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoCard from './RepoCard.vue';

const now = new Date().toISOString();

function mockRepository(overrides: Record<string, unknown> = {}) {
  return {
    id: 'repo-1',
    identityId: 'user-1',
    name: '个人知识库',
    type: 'Personal',
    path: '/repos/personal',
    description: '存储个人学习笔记和技术资料。',
    config: {},
    stats: {},
    status: 'Active',
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    statusText: '活跃',
    typeText: '个人',
    folderCount: 12,
    resourceCount: 48,
    totalSize: 5242880,
    formattedSize: '5 MB',
    createdAtText: '2024-01-01',
    updatedAtText: '2024-12-01',
    ...overrides,
  } as any;
}

const meta = {
  title: 'Business/Repository/RepoCard',
  component: RepoCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 360px;"><story /></div>' })],
  argTypes: {
    repository: { description: '仓库数据对象 (RepositoryClientDTO)' },
  },
} satisfies Meta<typeof RepoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    repository: mockRepository(),
  },
};

export const Archived: Story = {
  args: {
    repository: mockRepository({
      id: 'repo-2',
      name: '旧项目笔记',
      description: '已归档的旧项目笔记合集。',
      status: 'Archived',
      isArchived: true,
      isActive: false,
      statusText: '已归档',
    }),
  },
};

export const NoDescription: Story = {
  args: {
    repository: mockRepository({
      id: 'repo-3',
      name: '临时笔记',
      description: null,
      resourceCount: 3,
      folderCount: 1,
    }),
  },
};
