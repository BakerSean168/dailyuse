import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIGenerateKRButton from './AIGenerateKRButton.vue';

const meta = {
  title: 'Business/Goal/AIGenerateKRButton',
  component: AIGenerateKRButton,
  tags: ['autodocs'],
} satisfies Meta<typeof AIGenerateKRButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">AIGenerateKRButton story scaffold.</div>',
  }),
};
