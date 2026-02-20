import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TemplateDesktopCard from './TemplateDesktopCard.vue';

const meta = {
  title: 'Business/Reminder/TemplateDesktopCard',
  component: TemplateDesktopCard,
  tags: ['autodocs'],
  argTypes: {
    template: { control: 'object' },
  },
} satisfies Meta<typeof TemplateDesktopCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

export const ActiveTemplate: Story = {
  render: (args) => ({
    components: { TemplateDesktopCard },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDesktopCard ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: {
      id: 'tmpl-1',
      name: 'Drink Water Reminder',
      description: 'Stay hydrated throughout the day by drinking water every 2 hours.',
      icon: null,
      color: '#2196F3',
      effectiveEnabled: true,
      groupId: 'grp-1',
      triggerText: 'Every 2 hours',
      trigger: {
        type: 'INTERVAL',
        interval: { minutes: 120 },
        fixedTime: null,
      },
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      updatedAt: now - 1000 * 60 * 60 * 2,
    },
  },
};

export const PausedTemplate: Story = {
  render: (args) => ({
    components: { TemplateDesktopCard },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDesktopCard ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: {
      id: 'tmpl-2',
      name: 'Morning Meditation',
      description: 'Start your day with a 10-minute meditation session.',
      icon: null,
      color: '#4CAF50',
      effectiveEnabled: false,
      groupId: null,
      triggerText: 'Daily at 7:00 AM',
      trigger: {
        type: 'FIXED_TIME',
        interval: null,
        fixedTime: { time: '07:00' },
      },
      createdAt: now - 1000 * 60 * 60 * 24 * 60,
      updatedAt: now - 1000 * 60 * 60 * 24 * 5,
    },
  },
};

export const NoTemplate: Story = {
  render: (args) => ({
    components: { TemplateDesktopCard },
    setup() {
      const dialogRef = { value: null as any };
      const onMounted = () => {
        setTimeout(() => dialogRef.value?.open(), 100);
      };
      return { args, dialogRef, onMounted };
    },
    template: `<TemplateDesktopCard ref="dialogRef" v-bind="args" @vue:mounted="onMounted" />`,
  }),
  args: {
    template: null,
  },
};
