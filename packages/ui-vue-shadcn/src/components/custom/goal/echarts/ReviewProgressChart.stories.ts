import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReviewProgressChart from './ReviewProgressChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  progress: 65,
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 50 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 50, weight: 50 },
  ],
};

const mockReview = {
  id: 'rev1',
  goalId: 'g1',
  period: '2024-Q2',
  reviewDate: '2024-06-30',
  overallScore: 4,
  progressAtReview: 65,
  previousProgress: 40,
  comments: '目标进展良好，月活增长稳定',
  keyResultReviews: [
    { keyResultId: 'kr1', score: 4, progressAtReview: 80, comment: '增长超预期' },
    { keyResultId: 'kr2', score: 3, progressAtReview: 50, comment: '需要加强运营' },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/ReviewProgressChart',
  component: ReviewProgressChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
    review: mockReview,
  },
} satisfies Meta<typeof ReviewProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { ReviewProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><ReviewProgressChart v-bind="args" /></div>',
  }),
};

export const HighScore: Story = {
  render: (args) => ({
    components: { ReviewProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><ReviewProgressChart v-bind="args" /></div>',
  }),
  args: {
    review: {
      ...mockReview,
      overallScore: 5,
      progressAtReview: 95,
      previousProgress: 70,
      keyResultReviews: [
        { keyResultId: 'kr1', score: 5, progressAtReview: 98, comment: '大幅超越目标' },
        { keyResultId: 'kr2', score: 5, progressAtReview: 92, comment: '优秀' },
      ],
    },
    goal: {
      ...mockGoal,
      progress: 95,
    },
  },
};

export const LowScore: Story = {
  render: (args) => ({
    components: { ReviewProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><ReviewProgressChart v-bind="args" /></div>',
  }),
  args: {
    review: {
      ...mockReview,
      overallScore: 2,
      progressAtReview: 20,
      previousProgress: 10,
      keyResultReviews: [
        { keyResultId: 'kr1', score: 2, progressAtReview: 25, comment: '进度落后' },
        { keyResultId: 'kr2', score: 1, progressAtReview: 15, comment: '需要调整策略' },
      ],
    },
    goal: {
      ...mockGoal,
      progress: 20,
    },
  },
};
