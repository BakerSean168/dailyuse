import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagsPanel from './TagsPanel.vue';

const meta = {
  title: 'Business/Repository/TagsPanel',
  component: TagsPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    () => ({ template: '<div style="max-width: 320px;"><story /></div>' }),
  ],
  argTypes: {
    statistics: { description: '标签统计信息' },
    selectedTag: { description: '当前选中的标签', control: 'text' },
    filteredResources: { description: '已筛选的资源' },
    loading: { description: '加载状态', control: 'boolean' },
    error: { description: '错误信息', control: 'text' },
  },
} satisfies Meta<typeof TagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    statistics: [
      { tag: 'TypeScript', count: 15 },
      { tag: 'Vue', count: 12 },
      { tag: 'Architecture', count: 8 },
      { tag: 'Testing', count: 6 },
      { tag: 'DevOps', count: 4 },
      { tag: 'Database', count: 3 },
    ],
    selectedTag: null,
    filteredResources: [],
    loading: false,
    error: null,
  },
};

export const WithSelection: Story = {
  args: {
    statistics: [
      { tag: 'TypeScript', count: 15 },
      { tag: 'Vue', count: 12 },
      { tag: 'Architecture', count: 8 },
    ],
    selectedTag: 'TypeScript',
    filteredResources: [
      { id: 'r1', title: 'TypeScript 类型体操指南', path: '/docs/ts-types.md', updatedAt: new Date().toISOString() },
      { id: 'r2', title: 'TS 配置最佳实践', path: '/docs/tsconfig.md', updatedAt: new Date(Date.now() - 86400_000).toISOString() },
      { id: 'r3', title: '泛型编程入门', path: '/docs/generics.md', updatedAt: new Date(Date.now() - 86400_000 * 3).toISOString() },
    ],
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    statistics: [],
    selectedTag: null,
    filteredResources: [],
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    statistics: [],
    selectedTag: null,
    filteredResources: [],
    loading: false,
    error: '加载标签统计失败。',
  },
};

export const Empty: Story = {
  args: {
    statistics: [],
    selectedTag: null,
    filteredResources: [],
    loading: false,
    error: null,
  },
};
