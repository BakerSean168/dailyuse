import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MarkdownEditor from './MarkdownEditor.vue';

const meta = {
  title: 'Business/Editor/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    darkMode: { control: 'boolean' },
    readonly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    modelValue: '# Hello World\n\nStart typing your **markdown** here.',
    darkMode: false,
    readonly: false,
    placeholder: 'Start writing...',
  },
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: '# Hello World\n\nStart typing your **markdown** here.',
  },
  render: (args) => ({
    components: { MarkdownEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 400px;"><MarkdownEditor v-bind="args" /></div>',
  }),
};

export const DarkMode: Story = {
  args: {
    modelValue: '# Dark Mode\n\nThis editor is in dark mode.',
    darkMode: true,
  },
  render: (args) => ({
    components: { MarkdownEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 400px; background: #1e1e2e;"><MarkdownEditor v-bind="args" /></div>',
  }),
};

export const ReadOnly: Story = {
  args: {
    modelValue: '# Read Only\n\nThis content **cannot** be edited.',
    readonly: true,
  },
  render: (args) => ({
    components: { MarkdownEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 400px;"><MarkdownEditor v-bind="args" /></div>',
  }),
};

export const WithPlaceholder: Story = {
  args: {
    modelValue: '',
    placeholder: 'Type your notes here...',
  },
  render: (args) => ({
    components: { MarkdownEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 400px;"><MarkdownEditor v-bind="args" /></div>',
  }),
};

export const RichContent: Story = {
  args: {
    modelValue: [
      '# Project Documentation',
      '',
      '## Overview',
      'This is a comprehensive document with various markdown features.',
      '',
      '## Code Example',
      '```typescript',
      'const greeting: string = "Hello";',
      'console.log(greeting);',
      '```',
      '',
      '## Links',
      '- [[Related Document]]',
      '- [External Link](https://example.com)',
      '',
      '> A blockquote for important notes.',
    ].join('\n'),
  },
  render: (args) => ({
    components: { MarkdownEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 500px;"><MarkdownEditor v-bind="args" /></div>',
  }),
};
