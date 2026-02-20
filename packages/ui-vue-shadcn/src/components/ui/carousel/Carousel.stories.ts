import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '.';

const meta = {
  title: 'Atoms/Carousel',
  component: Carousel,
  tags: ['autodocs'],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious },
    template: `
      <div class="w-full max-w-xs mx-auto">
        <Carousel>
          <CarouselContent>
            <CarouselItem v-for="i in 5" :key="i">
              <div class="flex aspect-square items-center justify-center rounded-md border bg-muted p-6">
                <span class="text-4xl font-semibold">{{ i }}</span>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    `,
  }),
};

export const MultipleSlidesVisible: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious },
    template: `
      <div class="w-full max-w-sm mx-auto">
        <Carousel :opts="{ align: 'start' }">
          <CarouselContent class="-ml-2">
            <CarouselItem v-for="i in 8" :key="i" class="basis-1/3 pl-2">
              <div class="flex aspect-square items-center justify-center rounded-md border bg-muted p-2">
                <span class="text-2xl font-semibold">{{ i }}</span>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    `,
  }),
};
