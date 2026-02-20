import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalReviewListCard from './GoalReviewListCard.vue';
import { createMockGoal, createMockReview } from '../__stories__/mock-data';

const goalWithReviews = createMockGoal({
  reviews: [
    createMockReview(),
    createMockReview({ id: 'review-2', type: 'Monthly', summary: '本月累计完成40道算法题', achievements: '掌握了动态规划核心方法', reviewedAt: Date.now() - 7 * 86400000 }),
  ],
} as any);

const meta = {
  title: 'Business/Goal/Cards/GoalReviewListCard',
  component: GoalReviewListCard,
  tags: ['autodocs'],
  argTypes: {
    goal: { description: '目标数据（含 reviews）', control: 'object' },
    isLoading: { description: '加载状态', control: 'boolean' },
  },
} satisfies Meta<typeof GoalReviewListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReviews: Story = {
  args: { goal: goalWithReviews, isLoading: false },
  render: (args) => ({
    components: { GoalReviewListCard },
    setup() {
      const ref = { value: null as any };
      const onMounted = () => setTimeout(() => ref.value?.openDialog(), 100);
      return { args, ref, onMounted };
    },
    template: '<GoalReviewListCard v-bind="args" ref="ref" />',
    mounted() { this.$refs.ref?.openDialog?.(); },
  }),
};

export const Empty: Story = {
  args: { goal: createMockGoal({ reviews: [] } as any), isLoading: false },
};

export const Loading: Story = {
  args: { goal: createMockGoal(), isLoading: true },
};
