import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KRPreviewList from './KRPreviewList.vue';

const mockResults = [
  { id: '1', title: '提升代码覆盖率到80%', targetValue: 80, unit: '%', weight: 40, importance: 'high', description: '通过单元测试和集成测试提升覆盖率', selected: true },
  { id: '2', title: '减少Bug数量50%', targetValue: 50, unit: '%', weight: 35, importance: 'medium', description: null, selected: true },
  { id: '3', title: '完成10次Code Review', targetValue: 10, unit: '次', weight: 25, importance: 'low', description: '每周至少参与2次团队代码审查', selected: false },
];

const meta = {
  title: 'Business/Goal/KRPreviewList',
  component: KRPreviewList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    results: { description: 'AI 生成的关键结果列表', control: 'object' },
  },
} satisfies Meta<typeof KRPreviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {
  args: { results: mockResults },
};

export const Empty: Story = {
  args: { results: [] },
};

export const SingleResult: Story = {
  args: { results: [mockResults[0]] },
};
