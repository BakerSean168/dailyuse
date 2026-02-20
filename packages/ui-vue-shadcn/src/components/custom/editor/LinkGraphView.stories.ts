import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkGraphView from './LinkGraphView.vue';

const meta = {
  title: 'Business/Editor/LinkGraphView',
  component: LinkGraphView,
  tags: ['autodocs'],
  argTypes: {
    documentId: { control: 'text' },
    initialDepth: { control: { type: 'number', min: 1, max: 5, step: 1 } },
  },
  args: {
    documentId: 'doc-abc-123',
    initialDepth: 2,
  },
} satisfies Meta<typeof LinkGraphView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    documentId: 'doc-abc-123',
    initialDepth: 2,
  },
  render: (args) => ({
    components: { LinkGraphView },
    setup() {
      return { args };
    },
    template: '<div style="height: 500px; width: 100%;"><LinkGraphView v-bind="args" /></div>',
  }),
};

export const ShallowDepth: Story = {
  args: {
    documentId: 'doc-abc-123',
    initialDepth: 1,
  },
  render: (args) => ({
    components: { LinkGraphView },
    setup() {
      return { args };
    },
    template: '<div style="height: 500px; width: 100%;"><LinkGraphView v-bind="args" /></div>',
  }),
};

export const DeepDepth: Story = {
  args: {
    documentId: 'doc-abc-123',
    initialDepth: 4,
  },
  render: (args) => ({
    components: { LinkGraphView },
    setup() {
      return { args };
    },
    template: '<div style="height: 500px; width: 100%;"><LinkGraphView v-bind="args" /></div>',
  }),
};
