<script setup lang="ts">
/**
 * UserSettingsView — 设置页（UI 重构 V2 § Settings / §7；沿 V1 §13 分组方案）
 *
 * 10 个平铺 Tab 重组为 6 组：
 *   外观与语言 / AI / 通知与提醒 / 账户与隐私（账户中心迁入）/ 数据 / 高级
 * 窄窗口（<1024）顶部分组 tabs；宽窗口左侧垂直分组导航 + 右侧内容 max-w-3xl。
 * `?tab=` 查询参数为分组深链契约（/account/center redirect 依赖）。
 * `settings-tab-{value}` testid 保留（appearance / notifications 被 e2e 锚定）。
 * 作为 AppShell STATE D 独立场景渲染，不进 BusinessPanel。
 */

import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Loader2 } from '@lucide/vue';
import { SystemChannels } from '@dailyuse/contracts/electron';

import AppearanceSettings from '../components/AppearanceSettings.vue';
import AISettings from '../components/AISettings.vue';
import LocaleSettings from '../components/LocaleSettings.vue';
import KnowledgeRepositorySettings from '../components/KnowledgeRepositorySettings.vue';
import PrivacySettings from '../components/PrivacySettings.vue';
import ShortcutSettings from '../components/ShortcutSettings.vue';
import NotificationSettings from '../components/NotificationSettings.vue';
import ExperimentalSettings from '../components/ExperimentalSettings.vue';
import SettingAdvancedActions from '../components/SettingAdvancedActions.vue';
import UserFilesSettings from '../components/UserFilesSettings.vue';
import { AccountProfileSection } from '../../account/components';

import { useUserSetting } from '../composables/useUserSetting';
import { useDataPortability } from '../composables/useDataPortability';
import { applyThemeMode } from '../composables';
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import type { AppLocale } from '../../../plugins/i18n';
import type { UserSettingPreferences } from '@dailyuse/contracts/setting';
import { inject } from 'vue';
import { DESKTOP_AUTH_API_KEY } from '../../../di/keys';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const presentationStore = usePresentationPreferenceStore();
const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
// 独立设置场景：窄窗口用顶部分组 tabs；宽窗口用左侧垂直导航。
const SETTINGS_NARROW_VIEWPORT = 1024;
const viewportWidth = ref(
  typeof window !== 'undefined' ? window.innerWidth : SETTINGS_NARROW_VIEWPORT,
);
const isNarrow = computed(() => viewportWidth.value < SETTINGS_NARROW_VIEWPORT);

function onViewportResize(): void {
  viewportWidth.value = window.innerWidth;
}

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('resize', onViewportResize);
});

const {
  userSetting,
  isLoading,
  getCategory,
  loadSettings,
  exportSettings,
  importSettings,
  updateCategory,
} = useUserSetting();

const {
  isAvailable: isDataPortabilityAvailable,
  isServerDisclosureAvailable,
  isExporting: isExportingData,
  isExportingServerDisclosure,
  isImporting: isImportingData,
  lastResult: dataPortabilityResult,
  exportAllData,
  exportServerHeldDataDisclosure,
  importAllData,
} = useDataPortability();

// ── 分组导航（§13-3）──
type SettingsGroup =
  'appearance' | 'repository' | 'ai' | 'notifications' | 'account' | 'data' | 'advanced';

const GROUP_VALUES: SettingsGroup[] = [
  'appearance',
  'repository',
  'ai',
  'notifications',
  'account',
  'data',
  'advanced',
];

function normalizeGroup(value: unknown): SettingsGroup {
  return GROUP_VALUES.includes(value as SettingsGroup) ? (value as SettingsGroup) : 'appearance';
}

const activeTab = ref<SettingsGroup>(normalizeGroup(route.query.tab));

const groups = computed(() => [
  { value: 'appearance' as const, label: t('setting.groups.appearance') },
  { value: 'repository' as const, label: t('setting.groups.repository') },
  { value: 'ai' as const, label: t('setting.groups.ai') },
  { value: 'notifications' as const, label: t('setting.groups.notifications') },
  { value: 'account' as const, label: t('setting.groups.account') },
  { value: 'data' as const, label: t('setting.groups.data') },
  { value: 'advanced' as const, label: t('setting.groups.advanced') },
]);

// `?tab=` 双向同步（深链契约）
watch(
  () => route.query.tab,
  (tab) => {
    const next = normalizeGroup(tab);
    if (next !== activeTab.value) {
      activeTab.value = next;
    }
  },
);

function selectGroup(group: SettingsGroup) {
  activeTab.value = group;
  if (route.query.tab !== group) {
    void router.replace({ query: { ...route.query, tab: group } });
  }
}

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

interface ShortcutCategory {
  name: string;
  label: string;
  iconComponent: unknown;
  shortcuts: { id: string; label: string; description: string; key: string; defaultKey: string }[];
}

interface Backup {
  key: string;
  label: string;
  time: number;
}

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
const shortcutCategories = ref<ShortcutCategory[]>([]);
const editingShortcut = ref(null);
const editingKey = ref('');

// Advanced state
const backups = ref<Backup[]>([]);
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
  const electronApi = desktopApi;
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

  const electronApi = desktopApi;
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
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onViewportResize);
  }
  await loadSettings();
  hydrateFromStore();
});
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

    <div class="mx-auto max-w-5xl px-6 py-8">
      <h1 class="text-2xl font-bold tracking-tight">{{ t('setting.title') }}</h1>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <div
        v-else
        class="mt-6 flex gap-6"
        :class="isNarrow ? 'flex-col' : 'flex-row'"
        data-testid="settings-panel-layout"
      >
        <!-- 窄档：顶部分组横向 tabs；宽档：左侧垂直分组导航（V2 §7 / V1 §13-8） -->
        <nav
          class="flex shrink-0 gap-1"
          :class="isNarrow ? 'overflow-x-auto' : 'w-48 flex-col overflow-visible'"
          :data-testid="isNarrow ? 'settings-group-tabs' : 'settings-group-sidebar'"
          :aria-label="t('setting.title')"
        >
          <button
            v-for="group in groups"
            :key="group.value"
            :data-testid="`settings-tab-${group.value}`"
            type="button"
            class="whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors"
            :class="
              activeTab === group.value
                ? 'bg-secondary font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            "
            @click="selectGroup(group.value)"
          >
            {{ group.label }}
          </button>
        </nav>

        <!-- 右侧内容 max-w-3xl（§13-3） -->
        <div class="min-w-0 max-w-3xl flex-1 space-y-8">
          <template v-if="activeTab === 'appearance'">
            <AppearanceSettings v-model="appearance" />
            <LocaleSettings :model-value="locale" @update:model-value="handleLocaleUpdate" />
          </template>

          <template v-else-if="activeTab === 'ai'">
            <AISettings />
          </template>

          <template v-else-if="activeTab === 'repository'">
            <KnowledgeRepositorySettings />
          </template>

          <template v-else-if="activeTab === 'notifications'">
            <NotificationSettings />
          </template>

          <template v-else-if="activeTab === 'account'">
            <AccountProfileSection />
            <PrivacySettings v-model="privacy" />
          </template>

          <template v-else-if="activeTab === 'data'">
            <UserFilesSettings />
            <SettingAdvancedActions
              :backups="backups"
              :sync-status="syncStatus"
              :syncing="syncing"
              :exporting-data="isExportingData"
              :importing-data="isImportingData"
              :data-portability-available="isDataPortabilityAvailable"
              :server-data-disclosure-available="isServerDisclosureAvailable"
              :exporting-server-data-disclosure="isExportingServerDisclosure"
              :data-portability-result="dataPortabilityResult"
              @export-j-s-o-n="handleExportJson"
              @import="handleImport"
              @export-all-data="exportAllData"
              @export-server-data-disclosure="exportServerHeldDataDisclosure"
              @import-all-data="importAllData"
            />
          </template>

          <template v-else-if="activeTab === 'advanced'">
            <ShortcutSettings
              :categories="shortcutCategories"
              :editing-shortcut="editingShortcut"
              :editing-key="editingKey"
            />
            <ExperimentalSettings v-model="experimental" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
