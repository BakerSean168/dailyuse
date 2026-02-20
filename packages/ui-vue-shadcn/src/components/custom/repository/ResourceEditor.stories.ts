import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceEditor from './ResourceEditor.vue';

const meta = {
  title: 'Business/Repository/ResourceEditor',
  component: ResourceEditor,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    resourceId: { description: '资源 ID', control: 'text' },
    resourceName: { description: '资源名称', control: 'text' },
    content: { description: 'Markdown 内容', control: 'text' },
    isSaving: { description: '保存状态', control: 'boolean' },
    hasUnsavedChanges: { description: '是否有未保存的更改', control: 'boolean' },
    wordCount: { description: '字数统计', control: 'number' },
  },
} satisfies Meta<typeof ResourceEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    resourceId: 'res-1',
    resourceName: 'Vue 3 学习笔记.md',
    content: `# Vue 3 学习笔记\n\n## Composition API\n\nVue 3 引入了 Composition API，提供了更好的逻辑复用方式。\n\n### ref 和 reactive\n\n\`\`\`typescript\nimport { ref, reactive } from 'vue';\n\nconst count = ref(0);\nconst state = reactive({ name: 'Vue', version: 3 });\n\`\`\`\n\n## 生命周期\n\n- \`onMounted\` - 组件挂载后\n- \`onUnmounted\` - 组件卸载前\n- \`onUpdated\` - 组件更新后`,
    isSaving: false,
    hasUnsavedChanges: false,
    wordCount: 85,
  },
};

export const Saving: Story = {
  args: {
    resourceId: 'res-1',
    resourceName: '项目架构文档.md',
    content: '# 架构文档\n\n正在保存...',
    isSaving: true,
    hasUnsavedChanges: true,
    wordCount: 3,
  },
};

export const Empty: Story = {
  args: {
    resourceId: 'res-new',
    resourceName: '未命名资源',
    content: '',
    isSaving: false,
    hasUnsavedChanges: false,
    wordCount: 0,
  },
};
