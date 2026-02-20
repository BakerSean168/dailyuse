import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ExperimentalSettings from './ExperimentalSettings.vue';

const defaultSettings = {
  enabled: false,
  features: [] as string[],
};

const meta = {
  title: 'Business/Setting/ExperimentalSettings',
  component: ExperimentalSettings,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    hasChanges: { control: 'boolean' },
  },
  args: {
    modelValue: defaultSettings,
    disabled: false,
    hasChanges: false,
  },
} satisfies Meta<typeof ExperimentalSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { ExperimentalSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model, args };
    },
    template: '<ExperimentalSettings v-model="model" :disabled="args.disabled" :hasChanges="args.hasChanges" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const WithFeaturesEnabled: Story = {
  render: (args: any) => ({
    components: { ExperimentalSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model, args };
    },
    template: '<ExperimentalSettings v-model="model" :disabled="args.disabled" :hasChanges="args.hasChanges" />',
  }),
  args: {
    modelValue: {
      enabled: true,
      features: ['ai-assistant', 'voice-input'],
    },
    hasChanges: true,
  },
};

export const Disabled: Story = {
  render: (args: any) => ({
    components: { ExperimentalSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model, args };
    },
    template: '<ExperimentalSettings v-model="model" :disabled="args.disabled" :hasChanges="args.hasChanges" />',
  }),
  args: {
    modelValue: {
      enabled: true,
      features: ['collaboration', 'analytics'],
    },
    disabled: true,
  },
};
