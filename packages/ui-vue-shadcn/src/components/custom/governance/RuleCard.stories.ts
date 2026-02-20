import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RuleCard from './RuleCard.vue';

const meta = {
  title: 'Business/Governance/RuleCard',
  component: RuleCard,
  tags: ['autodocs'],
  argTypes: {
    rule: { control: 'object' },
  },
  decorators: [() => ({ template: '<div class="max-w-lg p-4"><story /></div>' })],
} satisfies Meta<typeof RuleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseRule = {
  code: 'GOV-001',
  title: 'Use strict TypeScript mode',
  description:
    'All TypeScript projects must enable strict mode in tsconfig.json to catch common type errors at compile time and improve code quality across the codebase.',
  severity: 'Mandatory' as const,
  status: 'Active',
  tags: ['typescript', 'config'],
  goodExamples: [{ id: '1' }, { id: '2' }],
  badExamples: [{ id: '3' }],
  updatedAt: '2025-01-15T10:30:00Z',
};

export const Default: Story = {
  args: { rule: baseRule },
};

export const Recommended: Story = {
  args: {
    rule: {
      ...baseRule,
      code: 'GOV-012',
      title: 'Prefer composition over inheritance',
      severity: 'Recommended',
      tags: ['architecture', 'design-patterns'],
      goodExamples: [{ id: '1' }],
      badExamples: [],
    },
  },
};

export const Draft: Story = {
  args: {
    rule: {
      ...baseRule,
      code: 'GOV-045',
      title: 'Database migration naming convention',
      status: 'Draft',
      tags: ['database', 'naming'],
      goodExamples: [],
      badExamples: [],
    },
  },
};

export const Deprecated: Story = {
  args: {
    rule: {
      ...baseRule,
      code: 'GOV-003',
      title: 'Use CommonJS modules',
      status: 'Deprecated',
      tags: ['modules', 'legacy'],
      deprecationReason:
        'ESM is now the standard. Migrate all projects to ES modules by Q2 2025.',
    },
  },
};

export const LongDescription: Story = {
  args: {
    rule: {
      ...baseRule,
      description:
        'This is a very long description that should be truncated after 150 characters to ensure the card layout remains consistent and visually appealing across all viewport sizes. The full description should be visible on the detail page.',
      tags: ['api', 'rest', 'naming', 'versioning', 'documentation'],
    },
  },
};
