import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ScrollArea, ScrollBar } from '.';

const meta = {
  title: 'Atoms/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ScrollArea },
    template: `
      <ScrollArea class="h-72 w-48 rounded-md border">
        <div class="p-4">
          <h4 class="mb-4 text-sm font-medium leading-none">Tags</h4>
          <div v-for="i in 50" :key="i" class="text-sm">
            v1.0.0-beta.{{ i }}
            <hr class="my-2" />
          </div>
        </div>
      </ScrollArea>
    `,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    template: `
      <ScrollArea class="w-96 whitespace-nowrap rounded-md border">
        <div class="flex w-max space-x-4 p-4">
          <div v-for="i in 20" :key="i" class="flex h-20 w-32 shrink-0 items-center justify-center rounded-md bg-muted">
            Item {{ i }}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    `,
  }),
};
