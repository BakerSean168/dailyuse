import type { Meta, StoryObj } from '@storybook/vue3';
import { Switch } from '.';
import { Label } from '../label';
import { ref } from 'vue';

const meta = {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() {
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="airplane-mode" v-model:checked="checked" />
        <Label for="airplane-mode">Airplane Mode</Label>
      </div>
    `,
  }),
};

export const Checked: Story = {
  render: () => ({
    components: { Switch, Label },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="checked" :default-checked="true" />
        <Label for="checked">Enabled</Label>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { Switch, Label },
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center space-x-2">
          <Switch id="disabled-off" disabled />
          <Label for="disabled-off" class="text-muted-foreground">Disabled (off)</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Switch id="disabled-on" disabled :default-checked="true" />
          <Label for="disabled-on" class="text-muted-foreground">Disabled (on)</Label>
        </div>
      </div>
    `,
  }),
};
