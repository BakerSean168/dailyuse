import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import EditorSettings from './EditorSettings.vue';

const defaultSettings = {
  defaultMode: 'editing' as const,
  autoSaveDelay: 3000,
  enableLinkPreview: true,
  enableMediaEmbed: true,
  supportedVideoSites: ['youtube.com', 'bilibili.com'],
  fontSize: 16,
  showLineNumbers: false,
  showWordCount: true,
};

const meta = {
  title: 'Business/Setting/EditorSettings',
  component: EditorSettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof EditorSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { EditorSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<EditorSettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const ReadingMode: Story = {
  render: (args: any) => ({
    components: { EditorSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<EditorSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      defaultMode: 'reading' as const,
      autoSaveDelay: 5000,
      enableLinkPreview: false,
      enableMediaEmbed: false,
      supportedVideoSites: [],
      fontSize: 18,
      showLineNumbers: true,
      showWordCount: false,
    },
  },
};

export const MinimalConfig: Story = {
  render: (args: any) => ({
    components: { EditorSettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<EditorSettings v-model="model" />',
  }),
  args: {
    modelValue: {
      defaultMode: 'editing' as const,
      autoSaveDelay: 1000,
      enableLinkPreview: false,
      enableMediaEmbed: false,
      supportedVideoSites: [],
      fontSize: 14,
      showLineNumbers: false,
      showWordCount: false,
    },
  },
};
