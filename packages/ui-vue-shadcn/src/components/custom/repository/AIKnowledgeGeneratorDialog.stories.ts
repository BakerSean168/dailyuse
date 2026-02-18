import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AIKnowledgeGeneratorDialog from './AIKnowledgeGeneratorDialog.vue';

const meta = {
  title: 'Business/Repository/AIKnowledgeGeneratorDialog',
  component: AIKnowledgeGeneratorDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof AIKnowledgeGeneratorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">AIKnowledgeGeneratorDialog story scaffold.</div>',
  }),
};
