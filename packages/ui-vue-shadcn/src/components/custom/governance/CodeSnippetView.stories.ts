import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CodeSnippetView from './CodeSnippetView.vue';

const meta = {
  title: 'Business/Governance/CodeSnippetView',
  component: CodeSnippetView,
  tags: ['autodocs'],
  argTypes: {
    snippet: { control: 'object' },
  },
  decorators: [() => ({ template: '<div class="max-w-2xl p-4"><story /></div>' })],
} satisfies Meta<typeof CodeSnippetView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GoodExample: Story = {
  args: {
    snippet: {
      type: 'GoodExample',
      language: 'typescript',
      content: `export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}`,
      caption: 'Use pure functions for calculations',
    },
  },
};

export const BadExample: Story = {
  args: {
    snippet: {
      type: 'BadExample',
      language: 'typescript',
      content: `let total = 0;
for (let i = 0; i < items.length; i++) {
  total = total + items[i].price * items[i].quantity;
}`,
      caption: 'Avoid mutable state in calculations',
    },
  },
};

export const JsonSnippet: Story = {
  args: {
    snippet: {
      type: 'GoodExample',
      language: 'json',
      content: `{
  "name": "@dailyuse/contracts",
  "version": "1.0.0",
  "type": "module"
}`,
    },
  },
};

export const YamlSnippet: Story = {
  args: {
    snippet: {
      type: 'GoodExample',
      language: 'yaml',
      content: `services:
  api:
    build: ./Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://localhost/dailyuse`,
    },
  },
};
