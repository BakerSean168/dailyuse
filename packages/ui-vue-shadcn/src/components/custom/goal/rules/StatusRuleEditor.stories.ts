import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatusRuleEditor from './StatusRuleEditor.vue';

const meta = {
  title: 'Business/Goal/Rules/StatusRuleEditor',
  component: StatusRuleEditor,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="max-width: 700px;"><story /></div>' })],
} satisfies Meta<typeof StatusRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { StatusRuleEditor },
    template: '<StatusRuleEditor />',
  }),
};

export const InCard: Story = {
  render: () => ({
    components: { StatusRuleEditor },
    template: `
      <div class="border rounded-lg p-4 shadow-sm">
        <h3 class="text-lg font-medium mb-4">状态规则配置</h3>
        <StatusRuleEditor />
      </div>
    `,
  }),
};
