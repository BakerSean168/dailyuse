import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BasicInfoSection from './BasicInfoSection.vue';

const meta = {
  title: 'Business/Task/TaskTemplateForm/Sections/BasicInfoSection',
  component: BasicInfoSection,
  tags: ['autodocs'],
} satisfies Meta<typeof BasicInfoSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">BasicInfoSection story scaffold.</div>',
  }),
};
