import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceEditor from './ResourceEditor.vue';

const meta = {
  title: 'Business/Repository/ResourceEditor',
  component: ResourceEditor,
  tags: ['autodocs'],
  argTypes: {
    isSaving: { control: 'boolean' },
    hasUnsavedChanges: { control: 'boolean' },
    wordCount: { control: 'number' },
  },
  args: {
    isSaving: false,
    hasUnsavedChanges: false,
  },
} satisfies Meta<typeof ResourceEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMarkdown = `# Getting Started

Welcome to the **Knowledge Base**. This document covers the essentials.

## Installation

\`\`\`bash
npm install @dailyuse/core
\`\`\`

## Usage

Import the module and initialize:

\`\`\`typescript
import { init } from '@dailyuse/core';
init({ theme: 'dark' });
\`\`\`

## Features

- Markdown editing with live preview
- Full-text search across documents
- Tag-based organization
`;

export const Default: Story = {
  args: {
    resourceId: 'res-1',
    resourceName: 'Getting Started Guide.md',
    content: sampleMarkdown,
    wordCount: 42,
  },
};

export const Saving: Story = {
  args: {
    resourceId: 'res-1',
    resourceName: 'Architecture.md',
    content: sampleMarkdown,
    isSaving: true,
    wordCount: 42,
  },
};

export const UnsavedChanges: Story = {
  args: {
    resourceId: 'res-1',
    resourceName: 'Draft Document.md',
    content: sampleMarkdown,
    hasUnsavedChanges: true,
    wordCount: 42,
  },
};

export const EmptyDocument: Story = {
  args: {
    resourceId: 'res-2',
    resourceName: 'Untitled.md',
    content: '',
    wordCount: 0,
  },
};
