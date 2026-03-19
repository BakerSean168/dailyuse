import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ObsidianEditor from './ObsidianEditor.vue';

const meta = {
  title: 'Business/Repository/ObsidianEditor',
  component: ObsidianEditor,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    content: { description: 'Markdown 内容', control: 'text' },
    fileName: { description: '文件名', control: 'text' },
    folderPath: { description: '文件夹路径', control: 'text' },
    isSaving: { description: '保存中', control: 'boolean' },
    isDirty: { description: '有未保存更改', control: 'boolean' },
  },
} satisfies Meta<typeof ObsidianEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: `# 欢迎使用编辑器\n\n这是一个 Markdown 编辑器组件。\n\n## 功能特性\n\n- 实时预览\n- 语法高亮\n- [[内部链接]] 支持\n- 文件拖放上传\n\n## 代码示例\n\n\`\`\`typescript\nconst message = 'Hello World';\nconsole.log(message);\n\`\`\``,
    fileName: '学习笔记.md',
    folderPath: '知识库/技术笔记',
    isSaving: false,
    isDirty: false,
  },
};

export const Saving: Story = {
  args: {
    content: '# 保存中的笔记\n\n内容正在保存...',
    fileName: 'draft.md',
    folderPath: '草稿',
    isSaving: true,
    isDirty: true,
  },
};

export const DirtyState: Story = {
  args: {
    content: '# 已修改的笔记\n\n这篇笔记有未保存的修改。',
    fileName: 'notes.md',
    folderPath: '日记',
    isSaving: false,
    isDirty: true,
  },
};

export const Empty: Story = {
  args: {
    content: '',
    fileName: '无标题',
    folderPath: '',
    isSaving: false,
    isDirty: false,
  },
};
