import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorSplitView from './EditorSplitView.vue';

const meta = {
  title: 'Business/Editor/EditorSplitView',
  component: EditorSplitView,
  tags: ['autodocs'],
  argTypes: {
    viewMode: {
      control: 'select',
      options: ['edit', 'preview', 'split'],
    },
    initialSplitPosition: { control: { type: 'range', min: 10, max: 90, step: 5 } },
  },
  args: {
    viewMode: 'split',
    initialSplitPosition: 50,
  },
} satisfies Meta<typeof EditorSplitView>;

export default meta;
type Story = StoryObj<typeof meta>;

const editorSlotContent = '<div style="padding: 16px; background: #1e1e2e; color: #cdd6f4; height: 100%; font-family: monospace;">Editor Pane</div>';
const previewSlotContent = '<div style="padding: 16px; height: 100%;">Preview Pane</div>';

export const Default: Story = {
  args: {
    viewMode: 'split',
    initialSplitPosition: 50,
  },
  render: (args) => ({
    components: { EditorSplitView },
    setup() {
      return { args };
    },
    template: `
      <EditorSplitView v-bind="args" style="height: 400px;">
        <template #editor>${editorSlotContent}</template>
        <template #preview>${previewSlotContent}</template>
      </EditorSplitView>
    `,
  }),
};

export const EditOnly: Story = {
  args: {
    viewMode: 'edit',
  },
  render: (args) => ({
    components: { EditorSplitView },
    setup() {
      return { args };
    },
    template: `
      <EditorSplitView v-bind="args" style="height: 400px;">
        <template #editor>${editorSlotContent}</template>
        <template #preview>${previewSlotContent}</template>
      </EditorSplitView>
    `,
  }),
};

export const PreviewOnly: Story = {
  args: {
    viewMode: 'preview',
  },
  render: (args) => ({
    components: { EditorSplitView },
    setup() {
      return { args };
    },
    template: `
      <EditorSplitView v-bind="args" style="height: 400px;">
        <template #editor>${editorSlotContent}</template>
        <template #preview>${previewSlotContent}</template>
      </EditorSplitView>
    `,
  }),
};

export const CustomSplitPosition: Story = {
  args: {
    viewMode: 'split',
    initialSplitPosition: 70,
  },
  render: (args) => ({
    components: { EditorSplitView },
    setup() {
      return { args };
    },
    template: `
      <EditorSplitView v-bind="args" style="height: 400px;">
        <template #editor>${editorSlotContent}</template>
        <template #preview>${previewSlotContent}</template>
      </EditorSplitView>
    `,
  }),
};
