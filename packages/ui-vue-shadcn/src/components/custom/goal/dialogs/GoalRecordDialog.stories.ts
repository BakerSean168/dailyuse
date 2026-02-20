import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalRecordDialog from './GoalRecordDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalRecordDialog',
  component: GoalRecordDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalRecordDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { GoalRecordDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalRecordDialog> | null>(null);
      const onMounted = () => {
        dialogRef.value?.openDialog?.();
      };
      return { dialogRef, onMounted };
    },
    template: '<GoalRecordDialog ref="dialogRef" @vue:mounted="onMounted" />',
  }),
};

export const Closed: Story = {
  render: () => ({
    components: { GoalRecordDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalRecordDialog> | null>(null);
      return { dialogRef };
    },
    template: `
      <div>
        <button class="px-4 py-2 bg-primary text-white rounded" @click="dialogRef?.openDialog?.()">添加记录</button>
        <GoalRecordDialog ref="dialogRef" />
      </div>
    `,
  }),
};
