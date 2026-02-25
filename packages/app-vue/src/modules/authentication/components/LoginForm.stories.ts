import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LoginForm from './LoginForm.vue';

const meta = {
  title: 'Business/Authentication/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    defaultTab: { control: 'select', options: ['email', 'phone'] },
    showRegisterLink: { control: 'boolean' },
    showForgotPassword: { control: 'boolean' },
  },
  args: {
    loading: false,
    defaultTab: 'email',
    showRegisterLink: true,
    showForgotPassword: true,
  },
} satisfies Meta<typeof LoginForm>;

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

export const NoRegisterLink: Story = {
  args: {
    showRegisterLink: false,
  },
};

export const NoForgotPassword: Story = {
  args: {
    showForgotPassword: false,
  },
};

export const Minimal: Story = {
  args: {
    showRegisterLink: false,
    showForgotPassword: false,
  },
};
