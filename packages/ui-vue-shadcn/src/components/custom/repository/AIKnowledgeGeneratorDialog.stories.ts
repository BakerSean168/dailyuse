import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIKnowledgeGeneratorDialog from './AIKnowledgeGeneratorDialog.vue';

const meta = {
  title: 'Business/Repository/AIKnowledgeGeneratorDialog',
  component: AIKnowledgeGeneratorDialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    repositoryName: { control: 'text' },
    parentFolderName: { control: 'text' },
  },
  args: {
    open: true,
    repositoryName: 'My Knowledge Base',
    parentFolderName: 'Research Notes',
  },
} satisfies Meta<typeof AIKnowledgeGeneratorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AIKnowledgeGeneratorDialog },
    setup: () => ({ args }),
    template: '<AIKnowledgeGeneratorDialog v-bind="args" />',
  }),
  args: {},
};

export const WithoutFolder: Story = {
  render: (args) => ({
    components: { AIKnowledgeGeneratorDialog },
    setup: () => ({ args }),
    template: '<AIKnowledgeGeneratorDialog v-bind="args" />',
  }),
  args: {
    parentFolderName: undefined,
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
};
