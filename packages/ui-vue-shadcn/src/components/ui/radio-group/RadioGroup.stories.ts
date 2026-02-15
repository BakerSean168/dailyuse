import type { Meta, StoryObj } from '@storybook/vue3';
import { RadioGroup, RadioGroupItem } from '.';
import { Label } from '../label';

const meta = {
  title: 'Atoms/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    template: `
      <RadioGroup default-value="comfortable">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="default" id="r1" />
          <Label for="r1">Default</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="comfortable" id="r2" />
          <Label for="r2">Comfortable</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="compact" id="r3" />
          <Label for="r3">Compact</Label>
        </div>
      </RadioGroup>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    template: `
      <RadioGroup default-value="a" disabled>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="a" id="rd1" />
          <Label for="rd1" class="text-muted-foreground">Option A</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="b" id="rd2" />
          <Label for="rd2" class="text-muted-foreground">Option B</Label>
        </div>
      </RadioGroup>
    `,
  }),
};
