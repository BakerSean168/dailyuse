import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalRecordDialog from './GoalRecordDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalRecordDialog',
  component: GoalRecordDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '目标记录弹窗。使用 `openDialog(goalId, krId, record?)` 方法打开，依赖 `useGoal()` composable。' } },
  },
} satisfies Meta<typeof GoalRecordDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 新建记录 */
export const CreateRecord: Story = {
  render: () => ({
    components: { GoalRecordDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalRecordDialog>>();
      const open = () => dialogRef.value?.openDialog('goal-1', 'kr-1');
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">添加记录</button><GoalRecordDialog ref="dialogRef" /></div>`,
  }),
};

/** 编辑已有记录 */
export const EditRecord: Story = {
  render: () => ({
    components: { GoalRecordDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalRecordDialog>>();
      const open = () =>
        dialogRef.value?.openDialog('goal-1', 'kr-1', {
          id: 'record-1',
          value: 3,
          comment: '完成了3道算法题',
          createdAt: new Date().toISOString(),
        } as any);
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">编辑记录</button><GoalRecordDialog ref="dialogRef" /></div>`,
  }),
};
