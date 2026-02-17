import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TodayTasksWidget from './TodayTasksWidget.vue';

const meta = {
  title: 'Business/Task/TodayTasksWidget',
  component: TodayTasksWidget,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
  args: {
    size: 'medium',
  },
} satisfies Meta<typeof TodayTasksWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'small' },
};

export const Large: Story = {
  args: { size: 'large' },
};

export const InGrid: Story = {
  render: () => ({
    components: { TodayTasksWidget },
    template: `
      <div class="grid grid-cols-3 gap-4 w-full max-w-4xl">
        <TodayTasksWidget size="small" />
        <TodayTasksWidget size="medium" />
        <TodayTasksWidget size="large" />
      </div>
    `,
  }),
};
