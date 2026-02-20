import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ExportDialog from './ExportDialog.vue';

const meta = {
  title: 'Business/Goal/DAG/ExportDialog',
  component: ExportDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof ExportDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ExportDialog },
    setup() {
      const open = ref(true);
      return { open };
    },
    template: '<ExportDialog v-model="open" />',
  }),
};

export const Closed: Story = {
  render: () => ({
    components: { ExportDialog },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div>
        <button class="px-4 py-2 bg-primary text-white rounded" @click="open = true">打开导出对话框</button>
        <ExportDialog v-model="open" />
      </div>
    `,
  }),
};
