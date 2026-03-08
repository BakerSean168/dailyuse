import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Input } from '.';
import { Label } from '../label';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url'] },
  },
  args: {
    placeholder: "Enter text..." as any,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="Email" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true as any, placeholder: 'Disabled input' },
};

export const WithValue: Story = {
  args: { modelValue: 'Hello World' },
};

export const Password: Story = {
  render: () => ({
    components: { Input },
    template: '<Input type="password" placeholder="Enter password" />',
  }),
};
