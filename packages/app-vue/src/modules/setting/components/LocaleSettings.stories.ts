import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import LocaleSettings from './LocaleSettings.vue';

const defaultSettings = {
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  weekStartsOn: 1,
  currency: 'CNY',
};

const meta = {
  title: 'Business/Setting/LocaleSettings',
  component: LocaleSettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof LocaleSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { LocaleSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<LocaleSettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const EnglishUS: Story = {
  render: (args) => ({
    components: { LocaleSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<LocaleSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      language: 'en-US',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'hh:mm A',
      weekStartsOn: 0,
      currency: 'USD',
    },
  },
};

export const Japanese: Story = {
  render: (args) => ({
    components: { LocaleSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<LocaleSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      language: 'ja-JP',
      timezone: 'Asia/Tokyo',
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      weekStartsOn: 1,
      currency: 'JPY',
    },
  },
};
