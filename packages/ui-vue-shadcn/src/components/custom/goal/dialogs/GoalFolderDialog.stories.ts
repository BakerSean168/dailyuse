import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GoalFolderDialog from './GoalFolderDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalFolderDialog',
  component: GoalFolderDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { GoalFolderDialog },
    setup() {
      const open = ref(true);
      return { open };
    },
    template: '<GoalFolderDialog v-model="open" />',
  }),
};

export const Closed: Story = {
  render: () => ({
    components: { GoalFolderDialog },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div>
        <button class="px-4 py-2 bg-primary text-white rounded" @click="open = true">新建文件夹</button>
        <GoalFolderDialog v-model="open" />
      </div>
    `,
  }),
};
