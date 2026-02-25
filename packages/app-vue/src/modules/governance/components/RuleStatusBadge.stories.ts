import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RuleStatusBadge from './RuleStatusBadge.vue';

const meta = {
  title: 'Business/Governance/RuleStatusBadge',
  component: RuleStatusBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    status: { description: '规则状态', control: 'select', options: ['Active', 'Draft', 'Deprecated'] },
  },
} satisfies Meta<typeof RuleStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { status: 'Active' },
};

export const Draft: Story = {
  args: { status: 'Draft' },
};

export const Deprecated: Story = {
  args: { status: 'Deprecated' },
};
