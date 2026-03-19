import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIKnowledgeGeneratorDialog from './AIKnowledgeGeneratorDialog.vue';

const meta = {
  title: 'Business/Repository/AIKnowledgeGeneratorDialog',
  component: AIKnowledgeGeneratorDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    open: { description: '是否打开对话框', control: 'boolean' },
    repositoryName: { description: '知识库名称', control: 'text' },
    parentFolderName: { description: '父文件夹名称', control: 'text' },
  },
} satisfies Meta<typeof AIKnowledgeGeneratorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    repositoryName: '个人知识库',
    parentFolderName: '技术笔记',
  },
};

export const NoFolder: Story = {
  args: {
    open: true,
    repositoryName: '项目笔记',
    parentFolderName: '',
  },
};

export const Closed: Story = {
  args: {
    open: false,
    repositoryName: '知识库',
    parentFolderName: '',
  },
};
