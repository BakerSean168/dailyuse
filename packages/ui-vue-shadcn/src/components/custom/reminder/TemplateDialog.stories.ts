import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TemplateDialog from './TemplateDialog.vue';

const meta = {
  title: 'Business/Reminder/TemplateDialog',
  component: TemplateDialog,
  tags: ['autodocs'],
  argTypes: {
    template: { control: 'object' },
    groupOptions: { control: 'object' },
  },
} satisfies Meta<typeof TemplateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGroups = [
  { id: 'grp-1', name: 'Work Reminders' },
  { id: 'grp-2', name: 'Health & Fitness' },
  { id: 'grp-3', name: 'Personal' },
];

export const CreateNew: Story = {
  render: (args) => ({
    components: { TemplateDialog },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: null,
    groupOptions: mockGroups,
  },
};

export const EditExisting: Story = {
  render: (args) => ({
    components: { TemplateDialog },
    setup() {
      const dialogRef = { value: null as any };
      const template = {
        id: 'tmpl-1',
        name: 'Drink Water',
        description: 'Stay hydrated every 2 hours',
        importanceLevel: 'MODERATE',
        triggerType: 'INTERVAL',
        trigger: { type: 'INTERVAL', interval: { minutes: 120 }, fixedTime: null },
        color: '#2196F3',
        icon: 'mdi-bell',
        tags: ['health', 'daily'],
        groupId: 'grp-2',
      };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.openForEdit(template), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: {
      id: 'tmpl-1',
      name: 'Drink Water',
      description: 'Stay hydrated every 2 hours',
      importanceLevel: 'MODERATE',
      trigger: { type: 'INTERVAL', interval: { minutes: 120 }, fixedTime: null },
      color: '#2196F3',
      tags: ['health', 'daily'],
      groupId: 'grp-2',
    },
    groupOptions: mockGroups,
  },
};

export const FixedTimeTemplate: Story = {
  render: (args) => ({
    components: { TemplateDialog },
    setup() {
      const dialogRef = { value: null as any };
      const template = {
        id: 'tmpl-2',
        name: 'Morning Standup',
        description: 'Join daily standup at 9 AM',
        importanceLevel: 'IMPORTANT',
        triggerType: 'FIXED_TIME',
        trigger: { type: 'FIXED_TIME', fixedTime: { time: '09:00' }, interval: null },
        color: '#FF9800',
        icon: 'mdi-bell',
        tags: ['work'],
        groupId: 'grp-1',
      };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.openForEdit(template), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: {
      id: 'tmpl-2',
      name: 'Morning Standup',
      trigger: { type: 'FIXED_TIME', fixedTime: { time: '09:00' }, interval: null },
      groupId: 'grp-1',
    },
    groupOptions: mockGroups,
  },
};
