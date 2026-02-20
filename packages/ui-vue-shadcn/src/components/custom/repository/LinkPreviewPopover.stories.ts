import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkPreviewPopover from './LinkPreviewPopover.vue';

const meta = {
  title: 'Business/Repository/LinkPreviewPopover',
  component: LinkPreviewPopover,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    visible: { description: '是否可见', control: 'boolean' },
    content: { description: '预览内容' },
    position: { description: '定位坐标' },
  },
} satisfies Meta<typeof LinkPreviewPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownPreview: Story = {
  args: {
    visible: true,
    content: {
      type: 'markdown' as const,
      name: 'Vue 3 入门指南.md',
      url: '/docs/vue3-guide.md',
      excerpt: 'Vue 3 是一个渐进式 JavaScript 框架，用于构建用户界面。本指南将介绍 Composition API 的基本用法...',
      size: 4096,
      id: 'res-1',
    },
    position: { x: 200, y: 200 },
  },
};

export const ImagePreview: Story = {
  args: {
    visible: true,
    content: {
      type: 'image' as const,
      name: 'architecture-diagram.png',
      url: '/images/architecture.png',
      size: 524288,
      id: 'res-2',
    },
    position: { x: 200, y: 200 },
  },
};

export const PDFPreview: Story = {
  args: {
    visible: true,
    content: {
      type: 'pdf' as const,
      name: '设计规范.pdf',
      url: '/docs/design-spec.pdf',
      size: 2097152,
      id: 'res-3',
    },
    position: { x: 200, y: 200 },
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    content: null,
    position: { x: 0, y: 0 },
  },
};
