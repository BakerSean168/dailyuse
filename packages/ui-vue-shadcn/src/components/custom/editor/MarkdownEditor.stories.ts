import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MarkdownEditor from './MarkdownEditor.vue';

const sampleContent = `# Hello World

这是一段测试内容。

## 子标题

- 列表项 1
- 列表项 2

\`\`\`typescript
const x = 42;
\`\`\`
`;

const meta = {
  title: 'Business/Editor/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 400px;"><story /></div>' })],
  argTypes: {
    modelValue: { description: 'Markdown 内容', control: 'text' },
    darkMode: { description: '暗色模式', control: 'boolean' },
    readonly: { description: '只读', control: 'boolean' },
    placeholder: { description: '占位文本', control: 'text' },
  },
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { modelValue: sampleContent, darkMode: false, readonly: false, placeholder: '开始输入...' },
};

export const ReadOnly: Story = {
  args: { modelValue: sampleContent, readonly: true },
};

export const DarkMode: Story = {
  args: { modelValue: sampleContent, darkMode: true },
};

export const Empty: Story = {
  args: { modelValue: '', placeholder: '在此输入 Markdown 内容...' },
};
