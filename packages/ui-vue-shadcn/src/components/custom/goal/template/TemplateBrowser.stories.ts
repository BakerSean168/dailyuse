import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TemplateBrowser from './TemplateBrowser.vue';

const meta = {
  title: 'Business/Goal/Template/TemplateBrowser',
  component: TemplateBrowser,
  tags: ['autodocs'],
} satisfies Meta<typeof TemplateBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">TemplateBrowser story scaffold.</div>',
  }),
};
