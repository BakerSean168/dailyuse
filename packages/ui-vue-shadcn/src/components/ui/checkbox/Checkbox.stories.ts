import type { Meta, StoryObj } from '@storybook/vue3';
import { Checkbox } from '.';
import { Label } from '../label';

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label for="terms">Accept terms and conditions</Label>
      </div>
    `,
  }),
};

export const Checked: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="checked" :default-checked="true" />
        <Label for="checked">Checked by default</Label>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label for="disabled" class="text-muted-foreground">Disabled</Label>
      </div>
    `,
  }),
};
