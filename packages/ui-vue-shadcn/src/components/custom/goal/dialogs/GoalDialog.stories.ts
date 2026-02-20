import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalDialog from './GoalDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalDialog',
  component: GoalDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { GoalDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);
      const onMounted = () => {
        dialogRef.value?.openForCreate?.();
      };
      return { dialogRef, onMounted };
    },
    template: '<GoalDialog ref="dialogRef" @vue:mounted="onMounted" />',
  }),
};

export const Closed: Story = {
  render: () => ({
    components: { GoalDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);
      return { dialogRef };
    },
    template: `
      <div>
        <button class="px-4 py-2 bg-primary text-white rounded" @click="dialogRef?.openForCreate?.()">新建目标</button>
        <GoalDialog ref="dialogRef" />
      </div>
    `,
  }),
};
