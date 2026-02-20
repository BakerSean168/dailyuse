import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import WorkflowSettings from './WorkflowSettings.vue';

const defaultSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  confirmBeforeDelete: true,
  defaultGoalView: 'LIST',
  defaultScheduleView: 'WEEK',
  defaultTaskView: 'KANBAN',
};

const meta = {
  title: 'Business/Setting/WorkflowSettings',
  component: WorkflowSettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof WorkflowSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { WorkflowSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<WorkflowSettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const KanbanFocused: Story = {
  render: (args: any) => ({
    components: { WorkflowSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<WorkflowSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      autoSave: true,
      autoSaveInterval: 15,
      confirmBeforeDelete: false,
      defaultGoalView: 'KANBAN',
      defaultScheduleView: 'DAY',
      defaultTaskView: 'KANBAN',
    },
  },
};

export const NoAutoSave: Story = {
  render: (args: any) => ({
    components: { WorkflowSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<WorkflowSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      autoSave: false,
      autoSaveInterval: 60,
      confirmBeforeDelete: true,
      defaultGoalView: 'TREE',
      defaultScheduleView: 'MONTH',
      defaultTaskView: 'MATRIX',
    },
  },
};
