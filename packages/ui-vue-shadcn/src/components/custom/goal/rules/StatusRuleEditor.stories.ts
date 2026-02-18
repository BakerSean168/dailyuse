import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatusRuleEditor from './StatusRuleEditor.vue';

const meta = {
  title: 'Business/Goal/Rules/StatusRuleEditor',
  component: StatusRuleEditor,
  tags: ['autodocs'],
} satisfies Meta<typeof StatusRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">StatusRuleEditor story scaffold.</div>',
  }),
};
