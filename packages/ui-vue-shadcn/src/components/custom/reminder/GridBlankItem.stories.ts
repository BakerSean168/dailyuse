import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GridBlankItem from './GridBlankItem.vue';

const meta = {
  title: 'Business/Reminder/GridBlankItem',
  component: GridBlankItem,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="w-32 h-32"><story /></div>' })],
} satisfies Meta<typeof GridBlankItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  render: () => ({
    components: { GridBlankItem },
    template: `
      <div class="w-32 h-32">
        <GridBlankItem>
          <span class="text-2xl text-muted-foreground">+</span>
        </GridBlankItem>
      </div>
    `,
  }),
};

export const WithLabel: Story = {
  render: () => ({
    components: { GridBlankItem },
    template: `
      <div class="w-32 h-32">
        <GridBlankItem>
          <div class="text-center">
            <span class="text-2xl text-muted-foreground">+</span>
            <p class="text-xs text-muted-foreground mt-1">Add new</p>
          </div>
        </GridBlankItem>
      </div>
    `,
  }),
};
