import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalFolderDialog from './GoalFolderDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalFolderDialog',
  component: GoalFolderDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GoalFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  render: () => ({
    components: { GoalFolderDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalFolderDialog>>();
      const open = () => dialogRef.value?.openForCreate();
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">新建文件夹</button><GoalFolderDialog ref="dialogRef" /></div>`,
  }),
};

export const EditMode: Story = {
  render: () => ({
    components: { GoalFolderDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof GoalFolderDialog>>();
      const open = () =>
        dialogRef.value?.openForEdit({
          id: 'folder-1',
          name: '工作目标',
          description: '工作相关目标',
          icon: 'briefcase',
          color: '#3b82f6',
        } as any);
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">编辑文件夹</button><GoalFolderDialog ref="dialogRef" /></div>`,
  }),
};
