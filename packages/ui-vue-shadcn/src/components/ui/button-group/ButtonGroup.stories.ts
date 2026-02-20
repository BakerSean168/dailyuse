import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '.';
import { Button } from '../button';

const meta = {
  title: 'Atoms/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ButtonGroup, Button },
    template: `
      <ButtonGroup>
        <Button variant="outline">Left</Button>
        <Button variant="outline">Center</Button>
        <Button variant="outline">Right</Button>
      </ButtonGroup>
    `,
  }),
};

export const WithSeparator: Story = {
  render: () => ({
    components: { ButtonGroup, ButtonGroupSeparator, Button },
    template: `
      <ButtonGroup>
        <Button variant="outline">Save</Button>
        <ButtonGroupSeparator />
        <Button variant="outline">Cancel</Button>
      </ButtonGroup>
    `,
  }),
};

export const WithText: Story = {
  render: () => ({
    components: { ButtonGroup, ButtonGroupText, Button },
    template: `
      <ButtonGroup>
        <Button variant="outline">-</Button>
        <ButtonGroupText>10</ButtonGroupText>
        <Button variant="outline">+</Button>
      </ButtonGroup>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components: { ButtonGroup, Button },
    template: `
      <ButtonGroup orientation="vertical">
        <Button variant="outline">Top</Button>
        <Button variant="outline">Middle</Button>
        <Button variant="outline">Bottom</Button>
      </ButtonGroup>
    `,
  }),
};
