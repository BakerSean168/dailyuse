import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkPreviewPopover from './LinkPreviewPopover.vue';

const meta = {
  title: 'Business/Repository/LinkPreviewPopover',
  component: LinkPreviewPopover,
  tags: ['autodocs'],
  argTypes: {
    visible: { control: 'boolean' },
  },
  args: {
    visible: true,
    position: { x: 200, y: 150 },
  },
} satisfies Meta<typeof LinkPreviewPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownPreview: Story = {
  args: {
    content: {
      type: 'markdown',
      name: 'Architecture Overview.md',
      excerpt: 'The system uses a domain-driven design approach with clear separation of concerns across multiple layers including domain, application, and infrastructure.',
      size: 4096,
      id: 'res-1',
    },
  },
};

export const ImagePreview: Story = {
  args: {
    content: {
      type: 'image',
      name: 'system-diagram.png',
      url: 'https://via.placeholder.com/400x300',
      size: 2097152,
      id: 'res-2',
    },
  },
};

export const PdfPreview: Story = {
  args: {
    content: {
      type: 'pdf',
      name: 'Technical Specification.pdf',
      excerpt: 'This document outlines the technical requirements and specifications for the platform.',
      size: 1048576,
      id: 'res-3',
    },
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    content: null,
    position: { x: 0, y: 0 },
  },
};
