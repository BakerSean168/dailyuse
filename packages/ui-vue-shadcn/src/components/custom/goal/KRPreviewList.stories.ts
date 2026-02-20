import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KRPreviewList from './KRPreviewList.vue';

const mockResults = [
  {
    id: 'kr-1',
    title: '将月活用户提升至 50,000',
    description: '通过营销推广和产品优化提升用户活跃度',
    targetValue: 50000,
    unit: '人',
    weight: 40,
    importance: 'high',
  },
  {
    id: 'kr-2',
    title: '客户满意度达到 4.5 分',
    description: '通过优化客服流程和产品质量提升满意度',
    targetValue: 4.5,
    unit: '分',
    weight: 30,
    importance: 'medium',
  },
  {
    id: 'kr-3',
    title: '缩短平均响应时间至 200ms',
    description: '优化后端服务和缓存策略',
    targetValue: 200,
    unit: 'ms',
    weight: 30,
    importance: 'high',
  },
];

const meta = {
  title: 'Business/Goal/KRPreviewList',
  component: KRPreviewList,
  tags: ['autodocs'],
  args: {
    results: mockResults,
  },
  decorators: [() => ({ template: '<div style="max-width: 700px;"><story /></div>' })],
} satisfies Meta<typeof KRPreviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {
    results: [],
  },
};

export const SingleResult: Story = {
  args: {
    results: [mockResults[0]],
  },
};

export const LowImportance: Story = {
  args: {
    results: [
      {
        id: 'kr-low',
        title: '整理技术文档',
        description: '更新 API 文档和使用指南',
        targetValue: 10,
        unit: '篇',
        weight: 20,
        importance: 'low',
      },
    ],
  },
};
