import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorSplitView from './EditorSplitView.vue';

const meta = {
  title: 'Business/Editor/EditorSplitView',
  component: EditorSplitView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="height: 500px;"><story /></div>' })],
  argTypes: {
    viewMode: { description: '视图模式', control: 'select', options: ['source', 'live', 'preview'] },
  },
} satisfies Meta<typeof EditorSplitView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
  args: { viewMode: 'live' },
  render: (args) => ({
    components: { EditorSplitView },
    setup: () => ({ args }),
    template: `<EditorSplitView v-bind="args"><template #editor><div class="p-4 h-full bg-muted/30">实时阅读编辑模式</div></template><template #preview><div class="p-4 h-full bg-muted/10">预览区域</div></template></EditorSplitView>`,
  }),
};

export const SourceOnly: Story = {
  args: { viewMode: 'source' },
  render: (args) => ({
    components: { EditorSplitView },
    setup: () => ({ args }),
    template: `<EditorSplitView v-bind="args"><template #editor><div class="p-4 h-full">纯源码模式</div></template><template #preview><div class="p-4 h-full">预览（隐藏）</div></template></EditorSplitView>`,
  }),
};

export const PreviewOnly: Story = {
  args: { viewMode: 'preview' },
  render: (args) => ({
    components: { EditorSplitView },
    setup: () => ({ args }),
    template: `<EditorSplitView v-bind="args"><template #editor><div class="p-4 h-full">编辑（隐藏）</div></template><template #preview><div class="p-4 h-full">仅预览模式</div></template></EditorSplitView>`,
  }),
};
