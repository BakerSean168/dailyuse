import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import KeyResultDialog from './KeyResultDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/KeyResultDialog',
  component: KeyResultDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof KeyResultDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { KeyResultDialog },
    setup() {
      const open = ref(true);
      return { open };
    },
    template: '<KeyResultDialog v-model="open" />',
  }),
};

export const Closed: Story = {
  render: () => ({
    components: { KeyResultDialog },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div>
        <button class="px-4 py-2 bg-primary text-white rounded" @click="open = true">新建关键结果</button>
        <KeyResultDialog v-model="open" />
      </div>
    `,
  }),
};
