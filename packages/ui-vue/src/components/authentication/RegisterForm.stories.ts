import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RegisterForm from './RegisterForm.vue';

const meta = {
  title: 'Business/Authentication/RegisterForm',
  component: RegisterForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    defaultTab: { control: 'select', options: ['email', 'phone'] },
    showLoginLink: { control: 'boolean' },
  },
  args: {
    loading: false,
    defaultTab: 'email',
    showLoginLink: true,
  },
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmailTab: Story = {
  args: {
    defaultTab: 'email',
  },
};

export const PhoneTab: Story = {
  args: {
    defaultTab: 'phone',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const NoLoginLink: Story = {
  args: {
    showLoginLink: false,
  },
};
