import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, h } from 'vue';
import GoalDialog from './GoalDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalDialog',
  component: GoalDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GoalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 创建目标弹窗 — 通过 ref 调用 expose 的 openForCreate */
export const CreateMode: Story = {
  render: () => ({
    components: { GoalDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalDialog>>();
      const open = () => dialogRef.value?.openForCreate();
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">新建目标</button><GoalDialog ref="dialogRef" /></div>`,
  }),
};

/** 编辑目标弹窗 — 通过 ref 调用 expose 的 openForEdit */
export const EditMode: Story = {
  render: () => ({
    components: { GoalDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalDialog>>();
      const open = () =>
        dialogRef.value?.openForEdit({
          id: 'goal-1',
          title: '提升编程能力',
          description: '通过系统学习和项目实践来提升编程技能',
        } as any);
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">编辑目标</button><GoalDialog ref="dialogRef" /></div>`,
  }),
};
