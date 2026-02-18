import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CriticalPathPanel from './CriticalPathPanel.vue';

const meta = {
  title: 'Business/Task/Critical-path/CriticalPathPanel',
  component: CriticalPathPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof CriticalPathPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">CriticalPathPanel story scaffold.</div>',
  }),
};
