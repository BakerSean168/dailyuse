<script setup lang="ts">
/**
 * UserSettingsView — Full settings page with internal tab navigation.
 *
 * Assembles all 10 setting section components inside a single Tabs container.
 * Uses useUserSetting() composable for data loading and persistence.
 */

import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import { Loader2 } from 'lucide-vue-next';
import { SystemChannels } from '@dailyuse/contracts/electron';

import AppearanceSettings from '../components/AppearanceSettings.vue';
import AISettings from '../components/AISettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import NotificationSettings from '../components/NotificationSettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';
import UserFilesSettings from '../components/UserFilesSettings.vue';

import { useUserSetting } from '../composables/useUserSetting';
import { applyThemeMode } from '../composables';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import type { AppLocale } from '../../../plugins/i18n';
import type { UserSettingPreferences } from '@dailyuse/contracts/setting';
import { getDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery';

const { t } = useI18n();
const presentationStore = usePresentationPreferenceStore();

const {
  userSetting,
  isLoading,
  error,
  getCategory,
  loadSettings,
  exportSettings,
  importSettings,
  updateCategory,
} = useUserSetting();

const activeTab = ref('appearance');
const isHydratingAppearance = ref(true);
const fileInput = ref<HTMLInputElement | null>(null);
type LocaleFormState = Required<UserSettingPreferences['locale']>;
type LocaleSettingsInput = {
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  currency?: string;
};

type OpenTextResult = {
  canceled: boolean;
  content: string | null;
};

// ── Section models — local reactive copies for v-model ──
const appearance = ref({
  theme: 'auto' as UserSettingPreferences['appearance']['theme'],
});

const locale = ref<LocaleFormState>({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24H',
  weekStartsOn: 1,
  currency: 'CNY',
});

const privacy = ref({
  profileVisibility: 'PRIVATE',
  showOnlineStatus: false,
  allowSearchByEmail: true,
  allowSearchByPhone: false,
  shareUsageData: false,
});

const experimental = ref({
  enabled: false,
  features: [] as string[],
});

// Shortcut state (read-only display for now)
const shortcutCategories = ref<any[]>([]);
const editingShortcut = ref(null);
const editingKey = ref('');

// Advanced state
const backups = ref<any[]>([]);
const syncStatus = ref(null);
const syncing = ref(false);

function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'zh-CN' || value === 'en-US';
}

function normalizeTimeFormat(
  value: string | undefined,
  fallback: LocaleFormState['timeFormat'],
): LocaleFormState['timeFormat'] {
  return value === '12H' || value === '24H' ? value : fallback;
}

/** Wrap importSettings for the @import event (which has no payload). */
async function handleImport() {
  const electronApi = getDesktopAuthApi();
  if (electronApi?.invoke) {
    try {
      const result = (await electronApi.invoke(SystemChannels.USER_FILES_OPEN_TEXT, {
        subdirectory: 'exports',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })) as OpenTextResult;

      if (!result.canceled && result.content) {
        await importSettings(JSON.parse(result.content));
      }
    } catch (err) {
      console.error('Failed to import settings JSON from desktop file dialog:', err);
    }
    return;
  }

  fileInput.value?.click();
}

function createSettingsExportFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `memoflow-settings-${timestamp}.json`;
}

async function handleExportJson() {
  const exported = await exportSettings();
  if (!exported) {
    return;
  }

  const electronApi = getDesktopAuthApi();
  if (electronApi?.invoke) {
    try {
      await electronApi.invoke(SystemChannels.USER_FILES_SAVE_TEXT, {
        subdirectory: 'exports',
        defaultFileName: createSettingsExportFilename(),
        content: exported,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      return;
    } catch (err) {
      console.error('Failed to export settings JSON via desktop file dialog:', err);
    }
  }

  const blob = new Blob([exported], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createSettingsExportFilename();
  link.click();
  URL.revokeObjectURL(url);
}

/** Handle file selection and read JSON content. */
async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);
      await importSettings(data);
    } catch (err) {
      console.error('Failed to parse settings JSON:', err);
    } finally {
      // Reset input so the same file can be selected again
      target.value = '';
    }
  };
  reader.readAsText(file);
}

async function handleLocaleUpdate(value: LocaleSettingsInput) {
  const previous = { ...locale.value };
  const next: LocaleFormState = {
    ...locale.value,
    ...value,
    timeFormat: normalizeTimeFormat(value.timeFormat, locale.value.timeFormat),
  };
  locale.value = next;

  if (isSupportedLocale(next.language)) {
    presentationStore.setLocale(next.language);
  }

  const result = await updateCategory('locale', next);
  if (result) {
    return;
  }

  locale.value = previous;
  if (isSupportedLocale(previous.language)) {
    presentationStore.setLocale(previous.language);
  }
}

// ── Hydrate from store when settings load ──
function hydrateFromStore() {
  isHydratingAppearance.value = true;

  try {
    const a = getCategory('appearance');
    if (a) Object.assign(appearance.value, a);

    const l = getCategory('locale');
    if (l) Object.assign(locale.value, l);

    const p = getCategory('privacy');
    if (p) Object.assign(privacy.value, p);

    const exp = getCategory('experimental');
    if (exp) Object.assign(experimental.value, exp);
  } finally {
    isHydratingAppearance.value = false;
  }
}

watch(userSetting, () => hydrateFromStore());

watch(
  () => appearance.value.theme,
  async (theme, previousTheme) => {
    if (isHydratingAppearance.value) {
      return;
    }

    applyThemeMode(theme);

    if (theme === previousTheme || previousTheme === undefined) {
      return;
    }

    await updateCategory('appearance', { theme });
  },
  { immediate: true },
);

onMounted(async () => {
  await loadSettings();
  hydrateFromStore();
});

// ── Tab definitions ──
const tabs = computed(() => [
  { value: 'appearance', label: t('setting.tabs.appearance') },
  { value: 'locale', label: t('setting.tabs.locale') },
  { value: 'ai', label: t('setting.tabs.ai') },
  { value: 'privacy', label: t('setting.tabs.privacy') },
  { value: 'shortcuts', label: t('setting.tabs.shortcuts') },
  { value: 'notifications', label: t('setting.tabs.notifications') },
  { value: 'experimental', label: t('setting.tabs.experimental') },
  { value: 'userFiles', label: t('setting.tabs.userFiles') },
  { value: 'advanced', label: t('setting.tabs.advanced') },
]);
</script>

<template>
  <div class="h-full min-h-0 overflow-auto bg-background">
    <!-- Hidden file input for importing settings -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden"
      aria-hidden="true"
      @change="onFileSelected"
    />

    <div class="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('setting.title') }}</h1>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <!-- Main content -->
      <Tabs v-else v-model="activeTab" class="w-full">
        <TabsList class="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            :data-testid="`settings-tab-${tab.value}`"
          >
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>

        <div class="mt-6">
          <TabsContent value="appearance">
            <AppearanceSettings v-model="appearance" />
          </TabsContent>

          <TabsContent value="locale">
            <LocaleSettings :model-value="locale" @update:model-value="handleLocaleUpdate" />
          </TabsContent>

          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettings v-model="privacy" />
          </TabsContent>

          <TabsContent value="shortcuts">
            <ShortcutSettings
              :categories="shortcutCategories"
              :editing-shortcut="editingShortcut"
              :editing-key="editingKey"
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="experimental">
            <ExperimentalSettings v-model="experimental" />
          </TabsContent>

          <TabsContent value="userFiles">
            <UserFilesSettings />
          </TabsContent>

          <TabsContent value="advanced">
            <SettingAdvancedActions
              :backups="backups"
              :sync-status="syncStatus"
              :syncing="syncing"
              @export-j-s-o-n="handleExportJson"
              @import="handleImport"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>
</template>
