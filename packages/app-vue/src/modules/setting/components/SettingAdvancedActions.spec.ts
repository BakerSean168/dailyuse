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
          exportPortableData: 'Export Importable Data',
          exportingPortableData: 'Exporting...',
          importPortableData: 'Import Data File',
          importingPortableData: 'Importing...',
          portableDataDescription:
            'Importable JSON only; excludes Vault files, GitHub authorization, projections, cache, and RAG.',
          exportServerDataDisclosure: 'Download Server-held Data Disclosure',
          exportingServerDataDisclosure: 'Preparing disclosure...',
          serverDataDisclosureDescription:
            'Non-importable JSON with projections, cached bytes, history, and RAG; no Memoflow-managed replayable GitHub authorization.',
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

function mountActions(dataPortabilityAvailable: boolean, serverDataDisclosureAvailable = false) {
  return mount(SettingAdvancedActions, {
    props: {
      dataPortabilityAvailable,
      serverDataDisclosureAvailable,
      exportingServerDataDisclosure: false,
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
    expect(wrapper.text()).not.toContain('Export Importable Data');
    expect(wrapper.text()).not.toContain('Import Data File');
    expect(wrapper.text()).not.toContain('Download Server-held Data Disclosure');
  });

  it('shows full data export/import actions when data portability is available', () => {
    const wrapper = mountActions(true);

    expect(wrapper.text()).toContain('Export Importable Data');
    expect(wrapper.text()).toContain('Import Data File');
    expect(wrapper.get('[data-testid="portable-data-scope"]').text()).toContain(
      'excludes Vault files, GitHub authorization, projections, cache, and RAG',
    );
  });

  it('shows the distinct non-importable server-held data disclosure when available', () => {
    const wrapper = mountActions(true, true);

    expect(wrapper.text()).toContain('Download Server-held Data Disclosure');
    expect(wrapper.get('[data-testid="server-data-scope"]').text()).toContain(
      'no Memoflow-managed replayable GitHub authorization',
    );
    expect(wrapper.get('[data-testid="server-data-scope"]').text()).toContain('Non-importable');
  });
});
