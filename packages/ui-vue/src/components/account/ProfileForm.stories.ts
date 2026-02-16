import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProfileForm from './ProfileForm.vue';

const meta = {
  title: 'Business/Account/ProfileForm',
  component: ProfileForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    showCancel: { control: 'boolean' },
  },
  args: {
    loading: false,
    showCancel: true,
  },
} satisfies Meta<typeof ProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockProfile = {
  nickname: 'JohnDoe',
  realName: 'John Doe',
  avatarUrl: null,
  bio: '一个热爱编程和生活的全栈开发者。',
  gender: 'MALE' as const,
  birthday: new Date('1995-06-15').getTime(),
};

export const Default: Story = {
  args: {
    profile: mockProfile,
  },
};

export const EmptyProfile: Story = {
  args: {
    profile: {
      nickname: '',
      realName: null,
      avatarUrl: null,
      bio: null,
      gender: 'PREFER_NOT_TO_SAY' as const,
      birthday: null,
    },
  },
};

export const Loading: Story = {
  args: {
    profile: mockProfile,
    loading: true,
  },
};

export const WithoutCancel: Story = {
  args: {
    profile: mockProfile,
    showCancel: false,
  },
};

export const WithAvatar: Story = {
  args: {
    profile: {
      ...mockProfile,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe',
    },
  },
};
