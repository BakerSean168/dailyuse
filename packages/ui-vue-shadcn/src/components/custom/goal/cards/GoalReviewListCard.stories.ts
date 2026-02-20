import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalReviewListCard from './GoalReviewListCard.vue';

const mockGoalWithReviews = {
  id: 'goal-1',
  name: '提升团队交付效率',
  status: 'Active',
  keyResults: [],
  reviews: [
    {
      id: 'rev-1',
      summary: 'Q2 周度复盘：流程优化初见成效',
      type: 'Weekly',
      reviewedAt: new Date('2024-06-14T16:00:00').toISOString(),
      achievements: '完成了 CI/CD 流程优化，构建时间缩短 40%',
    },
    {
      id: 'rev-2',
      summary: '月度复盘：团队协作提升',
      type: 'Monthly',
      reviewedAt: new Date('2024-06-01T10:00:00').toISOString(),
      achievements: '引入每日站会机制，信息同步效率提升',
    },
    {
      id: 'rev-3',
      summary: 'Q1 季度复盘',
      type: 'Quarterly',
      reviewedAt: new Date('2024-03-31T14:00:00').toISOString(),
      achievements: '',
    },
  ],
};

const mockGoalNoReviews = {
  id: 'goal-2',
  name: '优化客户满意度',
  status: 'Active',
  keyResults: [],
  reviews: [],
};

const meta = {
  title: 'Business/Goal/Cards/GoalReviewListCard',
  component: GoalReviewListCard,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalReviewListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReviews: Story = {
  render: (args) => ({
    components: { GoalReviewListCard },
    setup() {
      const cardRef = ref();
      const onMounted = () => {
        setTimeout(() => cardRef.value?.openDialog(), 0);
      };
      return { args, cardRef, onMounted };
    },
    template: '<GoalReviewListCard ref="cardRef" v-bind="args" @vue:mounted="onMounted" />',
  }),
  args: {
    goal: mockGoalWithReviews,
    isLoading: false,
  },
};

export const Empty: Story = {
  render: (args) => ({
    components: { GoalReviewListCard },
    setup() {
      const cardRef = ref();
      const onMounted = () => {
        setTimeout(() => cardRef.value?.openDialog(), 0);
      };
      return { args, cardRef, onMounted };
    },
    template: '<GoalReviewListCard ref="cardRef" v-bind="args" @vue:mounted="onMounted" />',
  }),
  args: {
    goal: mockGoalNoReviews,
    isLoading: false,
  },
};

export const Loading: Story = {
  render: (args) => ({
    components: { GoalReviewListCard },
    setup() {
      const cardRef = ref();
      const onMounted = () => {
        setTimeout(() => cardRef.value?.openDialog(), 0);
      };
      return { args, cardRef, onMounted };
    },
    template: '<GoalReviewListCard ref="cardRef" v-bind="args" @vue:mounted="onMounted" />',
  }),
  args: {
    goal: mockGoalWithReviews,
    isLoading: true,
  },
};
