import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RuleCard from './RuleCard.vue';
import type { RuleClientDTO } from '@dailyuse/contracts/governance';

const mockRule = {
  code: 'RULE-001',
  title: '使用严格类型检查',
  description: '所有 TypeScript 文件必须启用 strict 模式，禁止使用 any 类型，确保编译时类型安全。这有助于在开发阶段就发现潜在的类型错误。',
  severity: 'Mandatory' as const,
  status: 'Active' as const,
  tags: ['typescript', 'type-safety', 'best-practice'],
  goodExamples: [{ id: '1' }, { id: '2' }],
  badExamples: [{ id: '3' }],
  updatedAt: new Date().toISOString(),
};

const meta = {
  title: 'Business/Governance/RuleCard',
  component: RuleCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 400px;"><story /></div>' })],
  argTypes: {
    rule: { description: '规则数据', control: 'object' },
  },
} satisfies Meta<typeof RuleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mandatory: Story = {
  args: { rule: mockRule as unknown as RuleClientDTO },
};

export const Recommended: Story = {
  args: {
    rule: { ...mockRule, code: 'RULE-002', title: '优先使用组合式 API', severity: 'Recommended', tags: ['vue', 'composition-api'] } as unknown as RuleClientDTO,
  },
};

export const Draft: Story = {
  args: {
    rule: { ...mockRule, code: 'RULE-003', title: '新规则草稿', status: 'Draft', tags: ['draft'] } as unknown as RuleClientDTO,
  },
};

export const Deprecated: Story = {
  args: {
    rule: {
      ...mockRule,
      code: 'RULE-004',
      title: '已弃用规则',
      status: 'Deprecated',
      deprecationReason: '该规则已被 RULE-005 替代',
      tags: ['deprecated'],
    } as unknown as RuleClientDTO,
  },
};
