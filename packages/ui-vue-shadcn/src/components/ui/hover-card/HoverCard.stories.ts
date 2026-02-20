import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.';
import { Button } from '../button';

const meta = {
  title: 'Atoms/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { HoverCard, HoverCardContent, HoverCardTrigger, Button },
    template: `
      <HoverCard>
        <HoverCardTrigger as-child>
          <Button variant="link">@nextjs</Button>
        </HoverCardTrigger>
        <HoverCardContent class="w-80">
          <div class="flex justify-between space-x-4">
            <div class="space-y-1">
              <h4 class="text-sm font-semibold">@nextjs</h4>
              <p class="text-sm">The React Framework – created and maintained by @vercel.</p>
              <div class="flex items-center pt-2">
                <span class="text-xs text-muted-foreground">Joined December 2021</span>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    `,
  }),
};
