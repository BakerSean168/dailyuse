import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import PrivacySettings from './PrivacySettings.vue';

const defaultSettings = {
  profileVisibility: 'FRIENDS',
  showOnlineStatus: true,
  allowSearchByEmail: true,
  allowSearchByPhone: false,
  shareUsageData: false,
};

const meta = {
  title: 'Business/Setting/PrivacySettings',
  component: PrivacySettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    modelValue: defaultSettings,
  },
} satisfies Meta<typeof PrivacySettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { PrivacySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<PrivacySettings v-model="model" />',
  }),
  args: {
    modelValue: defaultSettings,
  },
};

export const PublicProfile: Story = {
  render: (args: any) => ({
    components: { PrivacySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<PrivacySettings v-model="model" />',
  }),
  args: {
    modelValue: {
      profileVisibility: 'PUBLIC',
      showOnlineStatus: true,
      allowSearchByEmail: true,
      allowSearchByPhone: true,
      shareUsageData: true,
    },
  },
};

export const MaxPrivacy: Story = {
  render: (args: any) => ({
    components: { PrivacySettings },
    setup() {
      const model = ref({ ...args.modelValue });
      return { model };
    },
    template: '<PrivacySettings v-model="model" />',
  }),
  args: {
    modelValue: {
      profileVisibility: 'PRIVATE',
      showOnlineStatus: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      shareUsageData: false,
    },
  },
};
