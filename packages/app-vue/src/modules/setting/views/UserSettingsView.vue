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

import AppearanceSettings from '../components/AppearanceSettings.vue';
import AISettings from '../components/AISettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import EditorSettings from '../components/EditorSettings.vue';
import WorkflowSettings from '../components/WorkflowSettings.vue';
import RepositorySettings from '../components/RepositorySettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import NotificationSettings from '../components/NotificationSettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';

import { useUserSetting } from '../composables/useUserSetting';
import { useLocaleSync } from '../composables/useLocaleSync';
import { getI18nGlobal } from '../../../plugins/i18n';
import type { AppLocale } from '../../../plugins/i18n';

const { t } = useI18n();

// Activate locale sync (bridge store → vue-i18n)
useLocaleSync();

const { userSetting, isLoading, error, getCategory, loadSettings, exportSettings, importSettings } =
  useUserSetting();

const activeTab = ref('appearance');

// ── Section models — local reactive copies for v-model ──
const appearance = ref({
  themeStyle: 'light',
  fontSize: 'MEDIUM',
  accentColor: '#3b82f6',
  compactMode: false,
  fontFamily: '',
});

const locale = ref({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24H',
  weekStartsOn: 1,
  currency: 'CNY',
});

const editor = ref({
  defaultMode: 'reading' as 'reading' | 'editing',
  autoSaveDelay: 500,
  enableLinkPreview: true,
  enableMediaEmbed: true,
  supportedVideoSites: ['youtube.com', 'bilibili.com'],
  fontSize: 16,
  showLineNumbers: false,
  showWordCount: true,
});

const workflow = ref({
  autoSave: true,
  autoSaveInterval: 10000,
  confirmBeforeDelete: true,
  defaultGoalView: 'LIST',
  defaultScheduleView: 'WEEK',
  defaultTaskView: 'LIST',
});

const repository = ref({
  imageEmbedMode: 'link',
  autoEmbedThreshold: 100,
  imageCompression: true,
  compressionQuality: 80,
  autoConvertToWebP: false,
  maxImageWidth: 1920,
  defaultViewMode: 'notes',
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

/** Wrap importSettings for the @import event (which has no payload). */
async function handleImport() {
  // TODO: Open a file picker and read JSON, then pass to importSettings
  await importSettings({});
}

// ── Hydrate from store when settings load ──
function hydrateFromStore() {
  const a = getCategory('appearance');
  if (a) Object.assign(appearance.value, a);

  const l = getCategory('locale');
  if (l) Object.assign(locale.value, l);

  const e = getCategory('editor');
  if (e) Object.assign(editor.value, e);

  const w = getCategory('workflow');
  if (w) Object.assign(workflow.value, w);

  // Note: 'repository' is not a PreferenceCategory in the schema.
  // RepositorySettings uses local defaults until backend adds the category.

  const p = getCategory('privacy');
  if (p) Object.assign(privacy.value, p);

  const exp = getCategory('experimental');
  if (exp) Object.assign(experimental.value, exp);
}

watch(userSetting, () => hydrateFromStore());

// ── Sync locale changes to vue-i18n immediately ──
watch(
  () => locale.value.language,
  (lang) => {
    const supported = ['zh-CN', 'en-US'];
    if (supported.includes(lang)) {
      const global = getI18nGlobal();
      if (global.locale && typeof global.locale === 'object' && 'value' in global.locale) {
        (global.locale as { value: string }).value = lang as AppLocale;
      }
    }
  },
);

onMounted(async () => {
  await loadSettings();
  hydrateFromStore();
});

// ── Tab definitions ──
const tabs = computed(() => [
  { value: 'appearance', label: t('setting.tabs.appearance') },
  { value: 'locale', label: t('setting.tabs.locale') },
  { value: 'editor', label: t('setting.tabs.editor') },
  { value: 'workflow', label: t('setting.tabs.workflow') },
  { value: 'repository', label: t('setting.tabs.repository') },
  { value: 'ai', label: t('setting.tabs.ai') },
  { value: 'privacy', label: t('setting.tabs.privacy') },
  { value: 'shortcuts', label: t('setting.tabs.shortcuts') },
  { value: 'notifications', label: t('setting.tabs.notifications') },
  { value: 'experimental', label: t('setting.tabs.experimental') },
  { value: 'advanced', label: t('setting.tabs.advanced') },
]);
</script>

<template>
  <div class="h-full min-h-0 overflow-auto bg-background">
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
          <TabsTrigger v-for="tab in tabs" :key="tab.value" :value="tab.value">
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>

        <div class="mt-6">
          <TabsContent value="appearance">
            <AppearanceSettings v-model="appearance" />
          </TabsContent>

          <TabsContent value="locale">
            <LocaleSettings v-model="locale" />
          </TabsContent>

          <TabsContent value="editor">
            <EditorSettings v-model="editor" />
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowSettings v-model="workflow" />
          </TabsContent>

          <TabsContent value="repository">
            <RepositorySettings v-model="repository" />
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

          <TabsContent value="advanced">
            <SettingAdvancedActions
              :backups="backups"
              :sync-status="syncStatus"
              :syncing="syncing"
              @export-j-s-o-n="exportSettings"
              @import="handleImport"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>
</template>
