import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ObsidianEditor from './ObsidianEditor.vue';

const meta = {
  title: 'Business/Repository/ObsidianEditor',
  component: ObsidianEditor,
  tags: ['autodocs'],
  argTypes: {
    isSaving: { control: 'boolean' },
    isDirty: { control: 'boolean' },
    fileName: { control: 'text' },
    folderPath: { control: 'text' },
  },
  args: {
    isSaving: false,
    isDirty: false,
  },
} satisfies Meta<typeof ObsidianEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleContent = `# Project Architecture

## Overview

The system is built using a **domain-driven design** approach with clear layer separation.

## Layers

1. **Domain** - Core business logic and entities
2. **Application** - Use cases and orchestration
3. **Infrastructure** - Database, external services
4. **Presentation** - UI components and views

## Key Decisions

- Event-driven communication between modules
- Repository pattern for data access
- CQRS for complex read/write scenarios

> Note: All modules follow the [[Coding Standards]] document.

See also: [[API Reference]] and [[Deployment Guide]].
`;

export const Default: Story = {
  args: {
    content: sampleContent,
    fileName: 'Architecture.md',
    folderPath: '/docs/technical',
  },
};

export const Dirty: Story = {
  args: {
    content: sampleContent,
    fileName: 'Draft Notes.md',
    folderPath: '/notes',
    isDirty: true,
  },
};

export const Saving: Story = {
  args: {
    content: sampleContent,
    fileName: 'Architecture.md',
    folderPath: '/docs/technical',
    isSaving: true,
  },
};

export const EmptyEditor: Story = {
  args: {
    content: '',
    fileName: 'New Document.md',
    folderPath: '/drafts',
  },
};
