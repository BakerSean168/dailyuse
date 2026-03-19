import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoInfoCard from './RepoInfoCard.vue';

const meta = {
  title: 'Business/Repository/RepoInfoCard',
  component: RepoInfoCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 320px;"><story /></div>' })],
  argTypes: {
    repository: { description: '仓库对象' },
    updateLabel: { description: '更新标签文本', control: 'text' },
  },
} satisfies Meta<typeof RepoInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    repository: {
      name: '个人知识库',
      description: '存储个人学习笔记和技术资料。',
      updatedAt: new Date().toISOString(),
    },
    updateLabel: '更新',
  },
};

export const NoDescription: Story = {
  args: {
    repository: {
      name: '项目笔记',
      updatedAt: new Date(Date.now() - 86400_000 * 7).toISOString(),
    },
    updateLabel: '更新',
  },
};

export const CustomLabel: Story = {
  args: {
    repository: {
      name: '技术博客',
      description: '发布在博客上的技术文章集合。',
      updatedAt: new Date(Date.now() - 86400_000 * 30).toISOString(),
    },
    updateLabel: 'Last updated',
  },
};
