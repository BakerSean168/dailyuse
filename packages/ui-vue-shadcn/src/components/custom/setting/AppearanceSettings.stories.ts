import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import AppearanceSettings from './AppearanceSettings.vue';

const defaultSettings = {
  themeStyle: 'light',
  fontSize: 'medium',
  accentColor: '#3b82f6',
  compactMode: false,
  fontFamily: null,
};

const meta = {
  title: 'Business/Setting/AppearanceSettings',
  component: AppearanceSettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof AppearanceSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { AppearanceSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<AppearanceSettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const DarkTheme: Story = {
  render: (args: any) => ({
    components: { AppearanceSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<AppearanceSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      themeStyle: 'dark',
      fontSize: 'large',
      accentColor: '#8b5cf6',
      compactMode: false,
      fontFamily: 'monospace',
    },
  },
};

export const CompactMode: Story = {
  render: (args: any) => ({
    components: { AppearanceSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<AppearanceSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      themeStyle: 'light',
      fontSize: 'small',
      accentColor: '#10b981',
      compactMode: true,
      fontFamily: null,
    },
  },
};

export const CustomThemeOptions: Story = {
  render: (args: any) => ({
    components: { AppearanceSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model, themeOptions: args.themeOptions };
    },
    template: '<AppearanceSettings v-model="model" :themeOptions="themeOptions" />',
  }),
  args: {
    modelValue: defaultSettings,
    themeOptions: [
      { label: 'Day Mode', value: 'light' },
      { label: 'Night Mode', value: 'dark' },
      { label: 'Auto (System)', value: 'system' },
    ],
  },
};
