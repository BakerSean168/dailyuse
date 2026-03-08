import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Textarea } from '.';
import { Label } from '../label';

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: { placeholder: 'Type your message here.' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="grid w-full gap-1.5">
        <Label for="message">Your message</Label>
        <Textarea id="message" placeholder="Type your message here." />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true as any, placeholder: 'Disabled textarea' },
};

export const WithValue: Story = {
  args: { modelValue: 'This is some pre-filled content in the textarea.' },
};
