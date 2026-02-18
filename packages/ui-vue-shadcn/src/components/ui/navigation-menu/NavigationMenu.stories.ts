import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { NavigationMenu } from '.';

const meta = {
  title: 'Atoms/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">NavigationMenu story scaffold.</div>',
  }),
};
