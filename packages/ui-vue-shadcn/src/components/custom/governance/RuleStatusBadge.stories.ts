import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RuleStatusBadge from './RuleStatusBadge.vue';

const meta = {
  title: 'Business/Governance/RuleStatusBadge',
  component: RuleStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Active', 'Draft', 'Deprecated'],
    },
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

export const Unknown: Story = {
  args: { status: 'CustomStatus' },
};

export const AllStatuses: Story = {
  render: () => ({
    components: { RuleStatusBadge },
    template: `
      <div class="flex items-center gap-3">
        <RuleStatusBadge status="Active" />
        <RuleStatusBadge status="Draft" />
        <RuleStatusBadge status="Deprecated" />
      </div>
    `,
  }),
};
