import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import SettingAdvancedActions from './SettingAdvancedActions.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      setting: {
        advanced: {
          title: 'Advanced',
          exportSettings: 'Export Settings',
          exportJSON: 'Export JSON',
          exportCSV: 'Export CSV',
          importSettings: 'Import Settings',
          createBackup: 'Create Backup',
          restoreBackup: 'Restore Backup',
          restoreBackupNoBackups: 'No Backups',
          cloudSync: 'Cloud Sync',
          syncing: 'Syncing...',
          syncAllDevices: 'Sync All Devices',
          viewVersionHistory: 'View Version History',
          lastSynced: 'Last synced',
          version: 'Version',
        },
        time: {
          justNow: 'just now',
          minutesAgo: '{n} minutes ago',
          hoursAgo: '{n} hours ago',
          daysAgo: '{n} days ago',
        },
      },
    },
  },
});

const PassthroughStub = defineComponent({
  name: 'PassthroughStub',
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled'],
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          onClick: () => emit('click'),
        },
        slots.default?.(),
      );
  },
});

function mountActions(dataPortabilityAvailable: boolean) {
  return mount(SettingAdvancedActions, {
    props: {
      dataPortabilityAvailable,
      backups: [],
      syncStatus: null,
      syncing: false,
      exportingData: false,
      importingData: false,
      dataPortabilityResult: null,
    },
    global: {
      plugins: [i18n],
      stubs: {
        Card: PassthroughStub,
        CardHeader: PassthroughStub,
        CardTitle: PassthroughStub,
        CardContent: PassthroughStub,
        Separator: PassthroughStub,
        Progress: PassthroughStub,
        DropdownMenu: PassthroughStub,
        DropdownMenuTrigger: PassthroughStub,
        DropdownMenuContent: PassthroughStub,
        DropdownMenuItem: ButtonStub,
        Button: ButtonStub,
        Settings2: true,
        Download: true,
        Upload: true,
        Save: true,
        RotateCcw: true,
        Cloud: true,
        CloudUpload: true,
        History: true,
        FileJson: true,
        FileText: true,
      },
    },
  });
}

describe('SettingAdvancedActions', () => {
  it('keeps settings export/import visible when full data portability is unavailable', () => {
    const wrapper = mountActions(false);

    expect(wrapper.text()).toContain('Export Settings');
    expect(wrapper.text()).toContain('Import Settings');
    expect(wrapper.text()).not.toContain('Export All Data');
    expect(wrapper.text()).not.toContain('Import All Data');
  });

  it('shows full data export/import actions when data portability is available', () => {
    const wrapper = mountActions(true);

    expect(wrapper.text()).toContain('Export All Data');
    expect(wrapper.text()).toContain('Import All Data');
  });
});
