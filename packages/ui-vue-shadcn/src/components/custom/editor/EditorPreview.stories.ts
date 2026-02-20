import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorPreview from './EditorPreview.vue';

const meta = {
  title: 'Business/Editor/EditorPreview',
  component: EditorPreview,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
  },
  args: {
    content: '# Sample Document\n\nThis is a **bold** and *italic* paragraph.\n\n## Links\n\nCheck out [[Related Note]] for more details.\n\n- List item 1\n- List item 2\n\n```js\nconsole.log("hello");\n```',
  },
} satisfies Meta<typeof EditorPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: '# My Document\n\nSome **markdown** content with a [[Wiki Link]] inside.',
  },
};

export const WithMultipleWikiLinks: Story = {
  args: {
    content:
      '# Project Notes\n\nSee [[Architecture]] for design decisions.\n\nRelated: [[Meeting Notes]] and [[TODO List]].\n\n> A blockquote for emphasis.',
  },
};

export const EmptyContent: Story = {
  args: {
    content: '',
  },
};

export const RichContent: Story = {
  args: {
    content: [
      '# Full Featured Preview',
      '',
      '## Headings and text',
      'Normal text with **bold**, *italic*, and `inline code`.',
      '',
      '## Lists',
      '- Unordered item',
      '- Another item',
      '',
      '1. Ordered item',
      '2. Second item',
      '',
      '## Code Block',
      '```typescript',
      'const x: number = 42;',
      '```',
      '',
      '## Links',
      'A [[Wiki Link]] and a [regular link](https://example.com).',
      '',
      '## Table',
      '| Name | Value |',
      '|------|-------|',
      '| A    | 1     |',
      '| B    | 2     |',
    ].join('\n'),
  },
};

export const WithLinkClickHandler: Story = {
  args: {
    content: 'Click [[This Link]] to trigger the handler.',
    onLinkClick: (title: string) => {
      console.log('Link clicked:', title);
    },
  },
};
