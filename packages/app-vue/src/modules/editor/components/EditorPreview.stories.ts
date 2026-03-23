import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorPreview from './EditorPreview.vue';

const sampleMarkdown = `# 示例笔记

这是一段 **加粗** 和 *斜体* 文本。

## 链接示例

这里有一个 [[双向链接]] 和一个 [[带别名的链接|显示文本]]。

## 代码

\`\`\`typescript
const hello = 'world';
\`\`\`

## 列表

- 项目一
- 项目二
  - 子项目
`;

const meta = {
  title: 'Business/Editor/EditorPreview',
  component: EditorPreview,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    content: { description: 'Markdown 内容', control: 'text' },
  },
} satisfies Meta<typeof EditorPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { content: sampleMarkdown },
};

export const Empty: Story = {
  args: { content: '' },
};

export const WithLinks: Story = {
  args: {
    content: '# 链接测试\n\n查看 [[项目笔记]] 获取更多信息。\n\n也可以参考 [[API指南|接口指南]]。',
  },
};
