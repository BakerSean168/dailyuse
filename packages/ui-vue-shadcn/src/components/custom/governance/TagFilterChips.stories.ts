import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TagFilterChips from './TagFilterChips.vue';

const meta = {
  title: 'Business/Governance/TagFilterChips',
  component: TagFilterChips,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    tags: { description: '所有可选标签' },
    selectedTags: { description: '已选中的标签' },
  },
} satisfies Meta<typeof TagFilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ['TypeScript', 'Vue', 'React', 'Node.js', '代码规范', '安全'],
    selectedTags: [],
  },
};

export const WithSelections: Story = {
  args: {
    tags: ['TypeScript', 'Vue', 'React', 'Node.js', '代码规范', '安全'],
    selectedTags: ['TypeScript', 'Vue'],
  },
};

export const AllSelected: Story = {
  args: {
    tags: ['TypeScript', 'Vue', 'React'],
    selectedTags: ['TypeScript', 'Vue', 'React'],
  },
};

export const SingleTag: Story = {
  args: {
    tags: ['TypeScript'],
    selectedTags: [],
  },
};
