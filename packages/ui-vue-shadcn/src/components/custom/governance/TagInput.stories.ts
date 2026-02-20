import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagInput from './TagInput.vue';

const meta = {
  title: 'Business/Governance/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    tags: { description: '当前标签列表' },
    suggestions: { description: '建议标签列表' },
    label: { description: '标签', control: 'text' },
    hint: { description: '提示文本', control: 'text' },
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ['TypeScript', 'Vue'],
    suggestions: ['React', 'Node.js', 'Python', 'Go', '安全', '代码规范'],
    label: '标签',
    hint: '回车添加标签',
  },
};

export const Empty: Story = {
  args: {
    tags: [],
    suggestions: ['TypeScript', 'Vue', 'React'],
    label: '标签',
    hint: '输入并回车添加标签',
  },
};

export const NoSuggestions: Story = {
  args: {
    tags: ['自定义标签1', '自定义标签2'],
    suggestions: [],
    label: '自定义标签',
  },
};

export const ManyTags: Story = {
  args: {
    tags: ['TypeScript', 'Vue', 'React', 'Node.js', 'Python', 'Go', 'Rust', 'Docker'],
    suggestions: ['Kubernetes', 'AWS', 'GraphQL'],
    label: '技术栈',
    hint: '添加更多技术标签',
  },
};
