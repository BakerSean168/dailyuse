import type { Meta, StoryObj } from '@storybook/vue3';
import { Label } from '.';
import { Input } from '../input';
import { Checkbox } from '../checkbox';

const meta = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Label },
    template: '<Label>Label text</Label>',
  }),
};

export const WithInput: Story = {
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="email">Your email</Label>
        <Input type="email" id="email" placeholder="Email" />
      </div>
    `,
  }),
};

export const WithCheckbox: Story = {
  render: () => ({
    components: { Label, Checkbox },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label for="terms">Accept terms and conditions</Label>
      </div>
    `,
  }),
};
