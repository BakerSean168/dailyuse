import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GridBlankItem from './GridBlankItem.vue';
import { Plus } from 'lucide-vue-next';

const meta = {
  title: 'Business/Reminder/GridBlankItem',
  component: GridBlankItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    () => ({ template: '<div style="width: 120px; height: 120px;"><story /></div>' }),
  ],
} satisfies Meta<typeof GridBlankItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlusIcon: Story = {
  render: () => ({
    components: { GridBlankItem, Plus },
    template: `
      <div style="width: 120px; height: 120px;">
        <GridBlankItem>
          <Plus class="h-8 w-8 text-gray-400" />
        </GridBlankItem>
      </div>
    `,
  }),
};

export const WithText: Story = {
  render: () => ({
    components: { GridBlankItem },
    template: `
      <div style="width: 120px; height: 120px;">
        <GridBlankItem>
          <span class="text-xs text-muted-foreground">添加</span>
        </GridBlankItem>
      </div>
    `,
  }),
};
