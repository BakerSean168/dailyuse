import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GroupDialog from './GroupDialog.vue';

const meta = {
  title: 'Business/Reminder/GroupDialog',
  component: GroupDialog,
  tags: ['autodocs'],
  argTypes: {
    group: { control: 'object' },
  },
} satisfies Meta<typeof GroupDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateNew: Story = {
  render: (args) => ({
    components: { GroupDialog },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<GroupDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: { group: null },
};

export const EditExisting: Story = {
  render: (args) => ({
    components: { GroupDialog },
    setup() {
      const dialogRef = { value: null as any };
      const group = {
        id: 'grp-1',
        name: 'Work Reminders',
        description: 'All work-related reminder templates',
        icon: 'mdi-briefcase',
        color: '#2196F3',
        controlMode: 'Individual',
        order: 1,
      };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.openForEdit(group), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<GroupDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    group: {
      id: 'grp-1',
      name: 'Work Reminders',
      description: 'All work-related reminder templates',
      icon: 'mdi-briefcase',
      color: '#2196F3',
      controlMode: 'Individual',
      order: 1,
    },
  },
};

export const GroupControlMode: Story = {
  render: (args) => ({
    components: { GroupDialog },
    setup() {
      const dialogRef = { value: null as any };
      const group = {
        id: 'grp-2',
        name: 'Health Goals',
        description: 'All controlled together',
        icon: 'mdi-heart',
        color: '#4CAF50',
        controlMode: 'Group',
        order: 2,
      };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.openForEdit(group), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<GroupDialog ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    group: {
      id: 'grp-2',
      name: 'Health Goals',
      description: 'All controlled together',
      icon: 'mdi-heart',
      color: '#4CAF50',
      controlMode: 'Group',
      order: 2,
    },
  },
};
