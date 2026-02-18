import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppearanceSettings from './AppearanceSettings.vue';

const meta = {
  title: 'Business/Setting/AppearanceSettings',
  component: AppearanceSettings,
  tags: ['autodocs'],
} satisfies Meta<typeof AppearanceSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">AppearanceSettings story scaffold.</div>',
  }),
};
