import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import RepositorySettings from './RepositorySettings.vue';

const defaultSettings = {
  imageEmbedMode: 'auto',
  autoEmbedThreshold: 100,
  imageCompression: true,
  compressionQuality: 80,
  autoConvertToWebP: true,
  maxImageWidth: 1920,
  defaultViewMode: 'grid',
};

const meta = {
  title: 'Business/Setting/RepositorySettings',
  component: RepositorySettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof RepositorySettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RepositorySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<RepositorySettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const LinkMode: Story = {
  render: (args: any) => ({
    components: { RepositorySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<RepositorySettings v-model="model" />',
  }),
  args: {
    modelValue: {
      imageEmbedMode: 'link',
      autoEmbedThreshold: 50,
      imageCompression: false,
      compressionQuality: 100,
      autoConvertToWebP: false,
      maxImageWidth: 2560,
      defaultViewMode: 'list',
    },
  },
};

export const HighCompression: Story = {
  render: (args: any) => ({
    components: { RepositorySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<RepositorySettings v-model="model" />',
  }),
  args: {
    modelValue: {
      imageEmbedMode: 'base64',
      autoEmbedThreshold: 200,
      imageCompression: true,
      compressionQuality: 50,
      autoConvertToWebP: true,
      maxImageWidth: 800,
      defaultViewMode: 'grid',
    },
  },
};
