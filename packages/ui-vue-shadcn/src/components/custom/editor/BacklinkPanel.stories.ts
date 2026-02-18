import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BacklinkPanel from './BacklinkPanel.vue';

const meta = {
  title: 'Business/Editor/BacklinkPanel',
  component: BacklinkPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof BacklinkPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">BacklinkPanel story scaffold.</div>',
  }),
};
