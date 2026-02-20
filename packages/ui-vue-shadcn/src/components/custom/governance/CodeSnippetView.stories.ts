import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CodeSnippetView from './CodeSnippetView.vue';

const meta = {
  title: 'Business/Governance/CodeSnippetView',
  component: CodeSnippetView,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 600px;"><story /></div>' })],
  argTypes: {
    snippet: { description: '代码片段数据', control: 'object' },
  },
} satisfies Meta<typeof CodeSnippetView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GoodExample: Story = {
  args: {
    snippet: {
      type: 'GoodExample',
      language: 'typescript',
      content: `interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction createUser(data: User): User {\n  return { ...data };\n}`,
      caption: '使用接口定义类型，确保类型安全',
    },
  },
};

export const BadExample: Story = {
  args: {
    snippet: {
      type: 'BadExample',
      language: 'typescript',
      content: `function createUser(data: any): any {\n  return data;\n}`,
      caption: '避免使用 any 类型',
    },
  },
};

export const JsonSnippet: Story = {
  args: {
    snippet: {
      type: 'GoodExample',
      language: 'json',
      content: `{\n  "name": "@dailyuse/contracts",\n  "version": "1.0.0",\n  "type": "module"\n}`,
    },
  },
};
