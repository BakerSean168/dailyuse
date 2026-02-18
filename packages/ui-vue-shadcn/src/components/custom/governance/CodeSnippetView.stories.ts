import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CodeSnippetView from './CodeSnippetView.vue';

const meta = {
  title: 'Business/Governance/CodeSnippetView',
  component: CodeSnippetView,
  tags: ['autodocs'],
} satisfies Meta<typeof CodeSnippetView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">CodeSnippetView story scaffold.</div>',
  }),
};
