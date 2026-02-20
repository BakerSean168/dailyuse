import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GridTemplateItem from './GridTemplateItem.vue';

const meta = {
  title: 'Business/Reminder/GridTemplateItem',
  component: GridTemplateItem,
  tags: ['autodocs'],
  argTypes: {
    item: { control: 'object' },
  },
  decorators: [() => ({ template: '<div class="w-40 p-4"><story /></div>' })],
} satisfies Meta<typeof GridTemplateItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: {
    item: {
      id: 'tmpl-1',
      name: 'Drink Water',
      effectiveEnabled: true,
    },
  },
};

export const Disabled: Story = {
  args: {
    item: {
      id: 'tmpl-2',
      name: 'Morning Meditation',
      effectiveEnabled: false,
    },
  },
};

export const LongName: Story = {
  args: {
    item: {
      id: 'tmpl-3',
      name: 'Take medication after lunch and log it in the health tracker',
      effectiveEnabled: true,
    },
  },
};
