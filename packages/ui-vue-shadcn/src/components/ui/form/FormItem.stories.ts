import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '.';
import { Input } from '../input';

const meta = {
  title: 'Atoms/Form',
  component: FormItem,
  tags: ['autodocs'],
} satisfies Meta<typeof FormItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input },
    template: `
      <FormItem class="w-[350px]">
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="Enter your email" />
        </FormControl>
        <FormDescription>We'll never share your email.</FormDescription>
        <FormMessage />
      </FormItem>
    `,
  }),
};

export const WithError: Story = {
  render: () => ({
    components: { FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input },
    template: `
      <FormItem class="w-[350px]">
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input placeholder="Enter username" />
        </FormControl>
        <FormDescription>Your public display name.</FormDescription>
        <FormMessage>Username must be at least 2 characters.</FormMessage>
      </FormItem>
    `,
  }),
};
