import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ExportDialog from './ExportDialog.vue';

const meta = {
  title: 'Business/Goal/Dag/ExportDialog',
  component: ExportDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'DAG 导出弹窗。支持 PNG/SVG/PDF 格式、分辨率、背景色等设置。' } },
  },
} satisfies Meta<typeof ExportDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ExportDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof ExportDialog>>();
      const open = () => dialogRef.value?.open();
      return { dialogRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">导出 DAG</button><ExportDialog ref="dialogRef" /></div>`,
  }),
};
