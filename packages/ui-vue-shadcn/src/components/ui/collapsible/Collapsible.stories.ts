import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.';
import { Button } from '../button';
import { ref } from 'vue';

const meta = {
  title: 'Atoms/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, Button },
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <Collapsible v-model:open="isOpen" class="w-[350px] space-y-2">
        <div class="flex items-center justify-between space-x-4 px-4">
          <h4 class="text-sm font-semibold">@peduarte starred 3 repositories</h4>
          <CollapsibleTrigger as-child>
            <Button variant="ghost" size="sm">
              {{ isOpen ? '▲' : '▼' }}
            </Button>
          </CollapsibleTrigger>
        </div>
        <div class="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          reka-ui
        </div>
        <CollapsibleContent class="space-y-2">
          <div class="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
            @unovue/colors
          </div>
          <div class="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
            @stitches/core
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
};
