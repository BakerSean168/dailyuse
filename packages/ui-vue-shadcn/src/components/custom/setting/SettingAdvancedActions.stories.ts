import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SettingAdvancedActions from './SettingAdvancedActions.vue';

const now = Date.now();

const mockBackups = [
  { key: 'backup-1', label: 'Auto Backup', time: now - 86400000 },
  { key: 'backup-2', label: 'Pre-migration Backup', time: now - 7 * 86400000 },
  { key: 'backup-3', label: 'Manual Backup', time: now - 30 * 86400000 },
];

const mockSyncStatus = {
  lastSyncedAt: now - 3600000,
  versionCount: 42,
  hasConflicts: false,
};

const meta = {
  title: 'Business/Setting/SettingAdvancedActions',
  component: SettingAdvancedActions,
  tags: ['autodocs'],
  argTypes: {
    syncing: { control: 'boolean' },
  },
  args: {
    backups: mockBackups,
    syncStatus: mockSyncStatus,
    syncing: false,
  },
} satisfies Meta<typeof SettingAdvancedActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    backups: mockBackups,
    syncStatus: mockSyncStatus,
  },
};

export const Syncing: Story = {
  args: {
    backups: mockBackups,
    syncStatus: mockSyncStatus,
    syncing: true,
  },
};

export const NoBackups: Story = {
  args: {
    backups: [],
    syncStatus: null,
  },
};

export const WithConflicts: Story = {
  args: {
    backups: mockBackups,
    syncStatus: {
      lastSyncedAt: now - 7200000,
      versionCount: 38,
      hasConflicts: true,
    },
  },
};
