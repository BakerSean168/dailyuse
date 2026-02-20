import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TemplateMoveDialog from './TemplateMoveDialog.vue';

const meta = {
  title: 'Business/Reminder/TemplateMoveDialog',
  component: TemplateMoveDialog,
  tags: ['autodocs'],
  argTypes: {
    template: { control: 'object' },
    groups: { control: 'object' },
    templates: { control: 'object' },
  },
} satisfies Meta<typeof TemplateMoveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGroups = [
  { id: 'grp-1', name: 'Work Reminders', description: 'Work related', icon: 'mdi-briefcase', enabled: true },
  { id: 'grp-2', name: 'Health & Fitness', description: 'Health goals', icon: 'mdi-heart', enabled: true },
  { id: 'grp-3', name: 'Archived', description: 'Old reminders', icon: 'mdi-folder', enabled: false },
];

const mockTemplates = [
  { id: 'tmpl-1', name: 'Drink Water', groupId: 'grp-2' },
  { id: 'tmpl-2', name: 'Standup', groupId: 'grp-1' },
  { id: 'tmpl-3', name: 'Exercise', groupId: 'grp-2' },
  { id: 'tmpl-4', name: 'Read', groupId: null },
];

export const MoveFromGroup: Story = {
  render: (args) => ({
    components: { TemplateMoveDialog },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateMoveDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: { id: 'tmpl-1', name: 'Drink Water', groupId: 'grp-2' },
    groups: mockGroups,
    templates: mockTemplates,
  },
};

export const MoveUngrouped: Story = {
  render: (args) => ({
    components: { TemplateMoveDialog },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateMoveDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: { id: 'tmpl-4', name: 'Read', groupId: null },
    groups: mockGroups,
    templates: mockTemplates,
  },
};

export const SingleGroup: Story = {
  render: (args) => ({
    components: { TemplateMoveDialog },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateMoveDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: { id: 'tmpl-2', name: 'Standup', groupId: 'grp-1' },
    groups: [mockGroups[0]],
    templates: mockTemplates,
  },
};
