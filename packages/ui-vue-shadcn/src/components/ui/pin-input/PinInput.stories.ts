import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { PinInput, PinInputGroup, PinInputInput, PinInputSeparator } from '.';

const meta = {
  title: 'Atoms/PinInput',
  component: PinInput,
  tags: ['autodocs'],
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputInput },
    template: `
      <PinInput placeholder="○">
        <PinInputGroup>
          <PinInputInput v-for="(id, index) in 6" :key="id" :index="index" />
        </PinInputGroup>
      </PinInput>
    `,
  }),
};

export const WithSeparator: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputInput, PinInputSeparator },
    template: `
      <PinInput placeholder="○">
        <PinInputGroup>
          <PinInputInput v-for="(id, index) in 3" :key="id" :index="index" />
        </PinInputGroup>
        <PinInputSeparator />
        <PinInputGroup>
          <PinInputInput v-for="(id, index) in 3" :key="id" :index="index + 3" />
        </PinInputGroup>
      </PinInput>
    `,
  }),
};
