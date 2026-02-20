import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SearchPanel from './SearchPanel.vue';

const meta = {
  title: 'Business/Repository/SearchPanel',
  component: SearchPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    () => ({ template: '<div style="max-width: 600px; height: 500px;"><story /></div>' }),
  ],
  argTypes: {
    repositoryId: { description: '仓库 ID', control: 'text' },
    searching: { description: '搜索中', control: 'boolean' },
    hasSearched: { description: '已执行过搜索', control: 'boolean' },
    totalResults: { description: '结果数', control: 'number' },
    totalMatches: { description: '匹配数', control: 'number' },
    searchTime: { description: '搜索耗时 (ms)', control: 'number' },
  },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {
  args: {
    repositoryId: 'repo-1',
    results: [
      {
        resourceId: 'res-1',
        resourceName: 'Vue 3 指南.md',
        resourcePath: '/docs/vue3-guide.md',
        resourceType: 'Markdown',
        matchType: 'line',
        matchCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        matches: [
          { lineNumber: 15, lineContent: 'Vue 3 引入了 Composition API', startIndex: 0, endIndex: 4 },
          { lineNumber: 42, lineContent: '使用 ref 和 reactive 管理状态', startIndex: 3, endIndex: 6 },
          { lineNumber: 78, lineContent: 'Vue 3 的性能相比 Vue 2 提升显著', startIndex: 0, endIndex: 4 },
        ],
      },
      {
        resourceId: 'res-2',
        resourceName: 'README.md',
        resourcePath: '/README.md',
        resourceType: 'Markdown',
        matchType: 'line',
        matchCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        matches: [
          { lineNumber: 5, lineContent: '基于 Vue 3 + TypeScript 构建', startIndex: 3, endIndex: 7 },
        ],
      },
    ] as any,
    searching: false,
    hasSearched: true,
    totalResults: 2,
    totalMatches: 4,
    searchTime: 42,
  },
};

export const Searching: Story = {
  args: {
    repositoryId: 'repo-1',
    results: [],
    searching: true,
    hasSearched: false,
    totalResults: 0,
    totalMatches: 0,
  },
};

export const NoResults: Story = {
  args: {
    repositoryId: 'repo-1',
    results: [],
    searching: false,
    hasSearched: true,
    totalResults: 0,
    totalMatches: 0,
    searchTime: 15,
  },
};

export const Initial: Story = {
  args: {
    repositoryId: 'repo-1',
    results: [],
    searching: false,
    hasSearched: false,
  },
};
