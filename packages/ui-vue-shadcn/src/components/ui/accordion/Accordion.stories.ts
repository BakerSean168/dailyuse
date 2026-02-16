import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '.';

const meta = {
  title: 'Atoms/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionContent, AccordionTrigger },
    template: `
      <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that matches the other components' aesthetic.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is it animated?</AccordionTrigger>
          <AccordionContent>
            Yes. It's animated by default, but you can disable it if you prefer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
};

export const Multiple: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionContent, AccordionTrigger },
    template: `
      <Accordion type="multiple" class="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>First Section</AccordionTrigger>
          <AccordionContent>Content for the first section.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Second Section</AccordionTrigger>
          <AccordionContent>Content for the second section.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Third Section</AccordionTrigger>
          <AccordionContent>Content for the third section.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
};
