import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import CreateScheduleDialog from './CreateScheduleDialog.vue';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

const now = new Date().toISOString();
const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

const existingSchedule: ScheduleJobClientDTO = {
  id: 'sched-1',
  identityId: 'user-1',
  title: 'Weekly Team Standup',
  description: 'Discuss progress and blockers',
  startTime: now,
  endTime: later,
  duration: 7200,
  hasConflict: false,
  priority: 2,
  location: 'Conference Room A',
  attendees: ['alice@example.com', 'bob@example.com'],
  createdAt: now,
  updatedAt: now,
};

const meta = {
  title: 'Business/Schedule/CreateScheduleDialog',
  component: CreateScheduleDialog,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
  args: {
    modelValue: true,
    loading: false,
  },
} satisfies Meta<typeof CreateScheduleDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { CreateScheduleDialog },
    setup() {
      const open = ref(args.modelValue);
      return { args, open };
    },
    template: '<CreateScheduleDialog v-bind="args" v-model="open" />',
  }),
  args: {
    modelValue: true,
  },
};

export const EditMode: Story = {
  render: (args: any) => ({
    components: { CreateScheduleDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<CreateScheduleDialog v-bind="args" v-model="open" />',
  }),
  args: {
    modelValue: true,
    schedule: existingSchedule,
  },
};

export const Loading: Story = {
  render: (args: any) => ({
    components: { CreateScheduleDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: '<CreateScheduleDialog v-bind="args" v-model="open" />',
  }),
  args: {
    modelValue: true,
    loading: true,
  },
};
