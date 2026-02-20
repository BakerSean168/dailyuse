import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import KeyResultDialog from './KeyResultDialog.vue';
import { createMockGoal, createMockKeyResult } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Dialogs/KeyResultDialog',
  component: KeyResultDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '关键结果创建/编辑弹窗。支持独立模式和目标编辑内嵌模式。' } },
  },
} satisfies Meta<typeof KeyResultDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 创建关键结果 */
export const CreateMode: Story = {
  render: () => ({
    components: { KeyResultDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof KeyResultDialog>>();
      const goal = createMockGoal();
      const open = () => dialogRef.value?.openForCreateKeyResult(goal.id);
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">新建关键结果</button><KeyResultDialog ref="dialogRef" /></div>`,
  }),
};

/** 编辑关键结果 */
export const EditMode: Story = {
  render: () => ({
    components: { KeyResultDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof KeyResultDialog>>();
      const goal = createMockGoal();
      const kr = createMockKeyResult();
      const open = () => dialogRef.value?.openForUpdateKeyResult(goal.id, kr as any);
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">编辑关键结果</button><KeyResultDialog ref="dialogRef" /></div>`,
  }),
};
