import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatusRuleEditor from './StatusRuleEditor.vue';

const meta = {
  title: 'Business/Goal/Rules/StatusRuleEditor',
  component: StatusRuleEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: '自动状态规则编辑器。内部使用 `useAutoStatusRules()` composable 管理状态。支持创建、编辑、删除规则，配置全局开关。' } },
  },
} satisfies Meta<typeof StatusRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 规则编辑器主视图（数据由 composable 内部管理） */
export const Default: Story = {};
