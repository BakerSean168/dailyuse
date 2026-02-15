import type { Meta, StoryObj } from '@storybook/vue3';
import { ToggleGroup, ToggleGroupItem } from '.';

const meta = {
  title: 'Atoms/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem },
    template: `
      <ToggleGroup type="single">
        <ToggleGroupItem value="left" aria-label="Align left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">Right</ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Multiple: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem },
    template: `
      <ToggleGroup type="multiple">
        <ToggleGroupItem value="bold" aria-label="Bold">B</ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">I</ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">U</ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Outline: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem },
    template: `
      <ToggleGroup type="single" variant="outline">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem },
    template: `
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
};
