<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.ai.title') }}</CardTitle>
      <CardDescription>{{ t('setting.ai.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="space-y-6">
          <div class="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
            <div class="space-y-1">
              <Label for="knowledge-note-subpath" class="text-base font-medium">
                {{ t('setting.ai.knowledgeNoteSubpath') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.knowledgeNoteSubpathDescription') }}
              </p>
            </div>

            <Input
              id="knowledge-note-subpath"
              v-model="draftSubpath"
              :disabled="isSavingSettings"
              :placeholder="t('setting.ai.knowledgeNoteSubpathPlaceholder')"
            />

            <p class="text-sm text-muted-foreground">
              {{ t('setting.ai.knowledgeNoteResolvedPath', { path: resolvedPathPreview }) }}
            </p>

            <div class="flex items-center justify-between gap-3">
              <p v-if="subpathError" class="text-sm text-destructive">{{ subpathError }}</p>
              <div class="ml-auto flex gap-2">
                <Button variant="outline" :disabled="isSavingSettings" @click="resetSubpath">
                  {{ t('setting.ai.resetPath') }}
                </Button>
                <Button :disabled="isSaveSubpathDisabled" @click="saveSubpath">
                  {{ t('setting.ai.savePath') }}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold">{{ t('setting.ai.quickProviderSectionTitle') }}</h3>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.quickProviderSectionDescription') }}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              :disabled="isLoadingProviders"
              @click="loadProviders"
            >
              {{ t('setting.ai.refreshProviders') }}
            </Button>
          </div>

          <div class="space-y-3">
            <div
              v-for="template in quickProviderTemplates"
              :key="template.id"
              class="rounded-xl border border-border/60 bg-background/70 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium">{{ template.name }}</p>
                    <Badge v-if="getPresetProvider(template.id)" variant="secondary">
                      {{ t('setting.ai.quickProviderConfigured') }}
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ template.description }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ getPresetModelSummary(template) }}
                  </p>
                </div>
                <a
                  v-if="template.apiKeyUrl"
                  :href="template.apiKeyUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="text-xs text-primary underline underline-offset-2"
                >
                  {{ t('setting.ai.getApiKey') }}
                </a>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  v-model="presetApiKeys[template.id]"
                  type="password"
                  class="flex-1"
                  :placeholder="t('setting.ai.quickProviderApiKeyPlaceholder', { provider: template.name })"
                />
                <Button
                  :disabled="isQuickProviderSubmitting(template.id) || !canSubmitPreset(template)"
                  @click="submitQuickProvider(template)"
                >
                  {{ getPresetActionLabel(template) }}
                </Button>
                <Button
                  v-if="getPresetProvider(template.id)"
                  variant="outline"
                  :disabled="
                    isQuickProviderSubmitting(template.id) ||
                    isProviderRefreshing(getProviderId(getPresetProvider(template.id)))
                  "
                  @click="handleRefreshModels(getProviderId(getPresetProvider(template.id)))"
                >
                  {{
                    isProviderRefreshing(getProviderId(getPresetProvider(template.id)))
                      ? t('setting.ai.refreshingModels')
                      : t('setting.ai.refreshModels')
                  }}
                </Button>
                <Button
                  v-if="getPresetProvider(template.id)"
                  variant="ghost"
                  :disabled="isQuickProviderSubmitting(template.id)"
                  @click="populateForm(getPresetProvider(template.id))"
                >
                  {{ t('setting.ai.manageAdvancedConfig') }}
                </Button>
              </div>

              <div
                class="mt-3 flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p class="text-sm font-medium">{{ t('setting.ai.markAsDefault') }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{
                      isPresetDefaultLocked(template.id)
                        ? t('setting.ai.quickProviderCurrentDefault')
                        : t('setting.ai.quickProviderDefaultHint')
                    }}
                  </p>
                </div>
                <Switch
                  :checked="shouldUsePresetAsDefault(template.id)"
                  :disabled="isPresetDefaultLocked(template.id) || isQuickProviderSubmitting(template.id)"
                  @update:checked="updatePresetDefaultSelection(template.id, $event)"
                />
              </div>

              <p
                v-if="getPresetProvider(template.id) && getProviderStatus(getProviderId(getPresetProvider(template.id)))"
                class="mt-3 text-xs"
                :class="
                  getProviderStatusTone(getProviderId(getPresetProvider(template.id))) === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                "
              >
                {{ getProviderStatus(getProviderId(getPresetProvider(template.id))) }}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 class="text-base font-semibold">{{ t('setting.ai.providerSectionTitle') }}</h3>
            <p class="text-sm text-muted-foreground">
              {{ t('setting.ai.providerSectionDescription') }}
            </p>
          </div>

          <div class="space-y-3">
            <div
              v-for="provider in providerItems"
              :key="getProviderId(provider)"
              class="rounded-xl border border-border/60 bg-background/70 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium">{{ getProviderName(provider) }}</p>
                    <Badge v-if="isDefaultProvider(provider)" variant="secondary">{{
                      t('setting.ai.defaultProvider')
                    }}</Badge>
                    <Badge v-if="!isProviderActive(provider)" variant="outline">{{
                      t('setting.ai.inactiveProvider')
                    }}</Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">{{ getProviderBaseUrl(provider) }}</p>
                  <p class="text-xs text-muted-foreground">{{ getProviderModel(provider) }}</p>
                  <p v-if="getProviderApiKeyMasked(provider)" class="text-xs text-muted-foreground">
                    {{ getProviderApiKeyMasked(provider) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{
                      t('setting.ai.providerModelsSummary', {
                        count: getAvailableModelCount(provider),
                      })
                    }}
                  </p>
                  <p
                    v-if="getProviderStatus(getProviderId(provider))"
                    class="text-xs"
                    :class="
                      getProviderStatusTone(getProviderId(provider)) === 'error'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    "
                  >
                    {{ getProviderStatus(getProviderId(provider)) }}
                  </p>
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    v-if="!isDefaultProvider(provider)"
                    variant="outline"
                    size="sm"
                    @click="handleSetDefault(getProviderId(provider))"
                  >
                    {{ t('setting.ai.setDefaultProvider') }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isProviderRefreshing(getProviderId(provider))"
                    @click="handleRefreshModels(getProviderId(provider))"
                  >
                    {{
                      isProviderRefreshing(getProviderId(provider))
                        ? t('setting.ai.refreshingModels')
                        : t('setting.ai.refreshModels')
                    }}
                  </Button>
                  <Button variant="outline" size="sm" @click="populateForm(provider)">
                    {{ t('setting.ai.loadIntoForm') }}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="handleDeleteProvider(getProviderId(provider))"
                  >
                    {{ t('setting.ai.deleteProvider') }}
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-if="!providerItems.length"
              class="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground"
            >
              {{ t('setting.ai.noProviders') }}
            </div>
          </div>

          <Separator />

          <div class="space-y-4">
            <div>
              <h4 class="font-medium">{{ t('setting.ai.advancedProviderSectionTitle') }}</h4>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.advancedProviderSectionDescription') }}
              </p>
            </div>

            <div class="grid gap-3">
              <Input
                v-model="providerForm.name"
                :placeholder="t('setting.ai.providerNamePlaceholder')"
              />
              <Input
                v-model="providerForm.baseUrl"
                :placeholder="t('setting.ai.providerBaseUrlPlaceholder')"
              />
              <Input
                v-model="providerForm.model"
                :placeholder="t('setting.ai.providerModelPlaceholder')"
              />
              <Input
                v-model="providerForm.apiKey"
                type="password"
                :placeholder="t('setting.ai.providerApiKeyPlaceholder')"
              />
              <p
                v-if="editingProviderApiKeyMasked"
                class="text-xs text-muted-foreground"
              >
                {{ editingProviderApiKeyMasked }}
              </p>
              <div
                class="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p class="text-sm font-medium">{{ t('setting.ai.markAsDefault') }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ t('setting.ai.markAsDefaultDescription') }}
                  </p>
                </div>
                <Switch
                  :checked="providerForm.isDefault"
                  @update:checked="providerForm.isDefault = $event"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button
                :disabled="isSubmittingProvider || !canSubmitProvider"
                @click="submitProvider"
              >
                {{
                  isEditingProvider
                    ? t('setting.ai.updateProvider')
                    : t('setting.ai.createProvider')
                }}
              </Button>
              <Button
                variant="outline"
                :disabled="isTestingProvider || !canTestProvider"
                @click="testProviderConnection"
              >
                {{
                  isTestingProvider ? t('setting.ai.testingProvider') : t('setting.ai.testProvider')
                }}
              </Button>
              <Button variant="ghost" :disabled="isSubmittingProvider" @click="resetProviderForm">
                {{ t('setting.ai.resetProviderForm') }}
              </Button>
            </div>

            <div
              v-if="providerTestResult"
              class="rounded-xl border border-border/60 bg-background/70 p-3 text-sm"
            >
              <p class="font-medium">
                {{
                  providerTestResult.ok
                    ? t('setting.ai.providerTestPassed')
                    : t('setting.ai.providerTestFailed')
                }}
              </p>
              <p class="mt-1 text-muted-foreground">{{ providerTestDetails }}</p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from '@dailyuse/ui-vue-shadcn';
import {
  AI_PROVIDER_TEMPLATES,
  type AIProviderConfigClientDTO,
  type AIProviderTemplate,
} from '@dailyuse/contracts/ai';
import { KnowledgeNoteSubpathSchema } from '@dailyuse/contracts/setting';
import { useUserSetting } from '../composables/useUserSetting';
import { useAI } from '../../ai/composables/useAI';
import { translateResultError } from '../../../shared/utils/translateResultError';

interface AIFormState {
  knowledgeNoteSubpath: string;
}

interface ProviderFormState {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isDefault: boolean;
}

type ProviderListItem = {
  id: string;
  name: string;
  baseUrl?: string;
  apiKeyMasked?: string;
  defaultModel?: string | null;
  availableModels?: Array<{ id: string; name?: string }>;
  isDefault?: boolean;
  isActive?: boolean;
};

type ProviderStatusTone = 'success' | 'error';

interface ProviderStatusState {
  tone: ProviderStatusTone;
  message: string;
}

const { t } = useI18n();
const { getCategory, updateCategory } = useUserSetting();
const {
  providers,
  isLoadingProviders,
  loadProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  refreshProviderModels,
  testProvider,
} = useAI();

const QUICK_PROVIDER_TEMPLATE_IDS = ['gemini', 'openai', 'openrouter'] as const;

const fallbackState: AIFormState = {
  knowledgeNoteSubpath: '',
};

const preferences = ref<AIFormState>({ ...fallbackState });
const draftSubpath = ref('');
const isSavingSettings = ref(false);

const providerForm = reactive<ProviderFormState>({
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
  isDefault: false,
});
const editingProviderId = ref<string | null>(null);
const isSubmittingProvider = ref(false);
const isTestingProvider = ref(false);
const providerTestResult = ref<{
  ok: boolean;
  response?: string;
  error?: string;
  latencyMs: number;
  model?: string;
} | null>(null);
const quickProviderSubmittingId = ref<string | null>(null);
const presetDefaultSelections = reactive<Record<string, boolean>>({
  gemini: false,
  openai: false,
  openrouter: false,
});
const providerRefreshLoading = reactive<Record<string, boolean>>({});
const providerStatusMap = reactive<Record<string, ProviderStatusState | null>>({});
const presetApiKeys = reactive<Record<string, string>>({
  gemini: '',
  openai: '',
  openrouter: '',
});

function getAISettingErrorMessage(error: unknown, fallbackKey: string) {
  return translateResultError(error, t, { fallbackKey });
}

const aiSettings = computed(() => getCategory('ai'));

function normalizeAIFormState(value?: Partial<AIFormState> | null): AIFormState {
  return {
    knowledgeNoteSubpath: value?.knowledgeNoteSubpath ?? fallbackState.knowledgeNoteSubpath,
  };
}

watch(
  aiSettings,
  (value) => {
    preferences.value = normalizeAIFormState(value);
    draftSubpath.value = preferences.value.knowledgeNoteSubpath;
  },
  { immediate: true },
);

onMounted(() => {
  void loadProviders();
});

const providerItems = computed(() =>
  (Array.isArray(providers.value) ? providers.value : []) as ProviderListItem[],
);
const editingProvider = computed(() =>
  editingProviderId.value
    ? providerItems.value.find((provider) => provider.id === editingProviderId.value) ?? null
    : null,
);
const editingProviderApiKeyMasked = computed(() => editingProvider.value?.apiKeyMasked ?? '');
const quickProviderTemplates = computed(() =>
  AI_PROVIDER_TEMPLATES.filter((template) =>
    QUICK_PROVIDER_TEMPLATE_IDS.includes(template.id as (typeof QUICK_PROVIDER_TEMPLATE_IDS)[number]),
  ),
);
const presetProviderMap = computed(() =>
  Object.fromEntries(
    quickProviderTemplates.value.map((template) => [
      template.id,
      providerItems.value.find(
        (provider) => normalizeProviderBaseUrl(provider.baseUrl) === normalizeProviderBaseUrl(template.baseUrl),
      ) ?? null,
    ]),
  ) as Record<string, ProviderListItem | null>,
);

const parsedSubpath = computed(() => KnowledgeNoteSubpathSchema.safeParse(draftSubpath.value));
const subpathError = computed(() => {
  if (parsedSubpath.value.success) return '';
  return parsedSubpath.value.error.issues[0]?.message ?? t('setting.ai.invalidSubpath');
});
const resolvedPathPreview = computed(() => {
  const subpath = parsedSubpath.value.success
    ? parsedSubpath.value.data
    : preferences.value.knowledgeNoteSubpath;
  return subpath ? `notes/${subpath}/` : 'notes/';
});
const isSaveSubpathDisabled = computed(() => {
  return (
    isSavingSettings.value ||
    !parsedSubpath.value.success ||
    parsedSubpath.value.data === preferences.value.knowledgeNoteSubpath
  );
});

const isEditingProvider = computed(() => editingProviderId.value !== null);
const canSubmitProvider = computed(() => {
  return Boolean(
    providerForm.name.trim() &&
    providerForm.baseUrl.trim() &&
    providerForm.model.trim() &&
    (isEditingProvider.value || providerForm.apiKey.trim()),
  );
});
const canTestProvider = computed(() => {
  return Boolean(
    providerForm.baseUrl.trim() && providerForm.model.trim() && providerForm.apiKey.trim(),
  );
});
const providerTestDetails = computed(() => {
  if (!providerTestResult.value) return '';
  const latency = `${providerTestResult.value.latencyMs}ms`;
  if (providerTestResult.value.ok) {
    return [providerTestResult.value.model, providerTestResult.value.response, latency]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    getAISettingErrorMessage(
      providerTestResult.value.error ? { message: providerTestResult.value.error } : null,
      'setting.ai.providerTestFailed',
    ),
    latency,
  ]
    .filter(Boolean)
    .join(' · ');
});

async function patchAISettings(patch: Partial<AIFormState>) {
  isSavingSettings.value = true;
  try {
    const nextState = { ...preferences.value, ...patch };
    const updated = await updateCategory('ai', nextState);
    if (!updated) return;

    preferences.value = normalizeAIFormState(updated.preferences?.ai);
    draftSubpath.value = preferences.value.knowledgeNoteSubpath;
    toast.success(t('setting.ai.saved'));
  } finally {
    isSavingSettings.value = false;
  }
}

async function saveSubpath() {
  if (!parsedSubpath.value.success) return;
  await patchAISettings({ knowledgeNoteSubpath: parsedSubpath.value.data });
}

function resetSubpath() {
  draftSubpath.value = preferences.value.knowledgeNoteSubpath;
}

function resetProviderForm() {
  editingProviderId.value = null;
  providerTestResult.value = null;
  providerForm.name = '';
  providerForm.baseUrl = '';
  providerForm.apiKey = '';
  providerForm.model = '';
  providerForm.isDefault = false;
}

function normalizeProviderBaseUrl(value?: string | null): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

function getPresetProvider(templateId: string): ProviderListItem | null {
  return presetProviderMap.value[templateId] ?? null;
}

function getAvailableModelCount(provider: unknown): number {
  return ((provider as ProviderListItem).availableModels ?? []).length;
}

function getPresetModelSummary(template: AIProviderTemplate): string {
  const provider = getPresetProvider(template.id);
  if (!provider) {
    return t('setting.ai.quickProviderNotConfigured');
  }

  const modelCount = getAvailableModelCount(provider);
  return t('setting.ai.quickProviderConfiguredSummary', {
    model: provider.defaultModel || template.defaultModel,
    count: modelCount,
  });
}

function getPresetActionLabel(template: AIProviderTemplate): string {
  if (quickProviderSubmittingId.value === template.id) {
    return getPresetProvider(template.id)
      ? t('setting.ai.quickProviderUpdating')
      : t('setting.ai.quickProviderConnecting');
  }

  return getPresetProvider(template.id)
    ? t('setting.ai.quickProviderUpdate')
    : t('setting.ai.quickProviderConnect');
}

function shouldUsePresetAsDefault(templateId: string): boolean {
  const provider = getPresetProvider(templateId);
  if (provider?.isDefault) {
    return true;
  }

  if (presetDefaultSelections[templateId]) {
    return true;
  }

  return providerItems.value.length === 0;
}

function updatePresetDefaultSelection(templateId: string, value: boolean) {
  const provider = getPresetProvider(templateId);
  if (provider?.isDefault && !value) {
    return;
  }

  presetDefaultSelections[templateId] = value;
}

function isPresetDefaultLocked(templateId: string): boolean {
  return Boolean(getPresetProvider(templateId)?.isDefault);
}

function canSubmitPreset(template: AIProviderTemplate): boolean {
  return presetApiKeys[template.id]?.trim().length > 0;
}

function isQuickProviderSubmitting(templateId: string): boolean {
  return quickProviderSubmittingId.value === templateId;
}

function getProviderId(provider: unknown): string {
  return String((provider as ProviderListItem).id);
}

function getProviderName(provider: unknown): string {
  return (provider as ProviderListItem).name;
}

function getProviderBaseUrl(provider: unknown): string {
  return (provider as ProviderListItem).baseUrl ?? '';
}

function getProviderModel(provider: unknown): string {
  return (provider as ProviderListItem).defaultModel ?? '';
}

function getProviderApiKeyMasked(provider: unknown): string {
  const masked = (provider as ProviderListItem).apiKeyMasked?.trim();
  return masked ? `API Key: ${masked}` : '';
}

function isDefaultProvider(provider: unknown): boolean {
  return Boolean((provider as ProviderListItem).isDefault);
}

function isProviderActive(provider: unknown): boolean {
  return (provider as ProviderListItem).isActive !== false;
}

function populateForm(provider: unknown) {
  const item = provider as ProviderListItem;
  editingProviderId.value = item.id;
  providerTestResult.value = null;
  providerForm.name = item.name;
  providerForm.baseUrl = item.baseUrl ?? '';
  providerForm.apiKey = '';
  providerForm.model = item.defaultModel ?? '';
  providerForm.isDefault = Boolean(item.isDefault);
}

function isProviderRefreshing(providerId: string): boolean {
  return providerRefreshLoading[providerId] === true;
}

function getProviderStatus(providerId: string): string {
  return providerStatusMap[providerId]?.message ?? '';
}

function getProviderStatusTone(providerId: string): ProviderStatusTone {
  return providerStatusMap[providerId]?.tone ?? 'success';
}

async function handleRefreshModels(providerId: string) {
  providerRefreshLoading[providerId] = true;
  providerStatusMap[providerId] = null;
  console.debug('[AISettings] refreshProviderModels:start', { providerId });
  try {
    const provider = (await refreshProviderModels(providerId)) as ProviderListItem;
    providerStatusMap[providerId] = {
      tone: 'success',
      message: t('setting.ai.providerModelsRefreshed', {
        count: getAvailableModelCount(provider),
      }),
    };
    console.debug('[AISettings] refreshProviderModels:done', {
      providerId,
      modelCount: getAvailableModelCount(provider),
      defaultModel: provider.defaultModel ?? null,
    });
    toast.success(t('setting.ai.providerModelsRefreshed'));
  } catch (error) {
    const message = getAISettingErrorMessage(error, 'setting.ai.providerModelsRefreshFailed');
    console.debug('[AISettings] refreshProviderModels:error', {
      providerId,
      message,
    });
    providerStatusMap[providerId] = {
      tone: 'error',
      message,
    };
    toast.error(message);
  } finally {
    providerRefreshLoading[providerId] = false;
  }
}

async function submitQuickProvider(template: AIProviderTemplate) {
  const apiKey = presetApiKeys[template.id]?.trim();
  if (!apiKey) return;

  const existing = getPresetProvider(template.id);
  quickProviderSubmittingId.value = template.id;

  try {
    let provider: AIProviderConfigClientDTO;
    if (existing) {
      provider = (await updateProvider(existing.id, {
        name: template.name,
        baseUrl: template.baseUrl,
        model: existing.defaultModel || template.defaultModel,
        apiKey,
      })) as AIProviderConfigClientDTO;
      if (shouldUsePresetAsDefault(template.id) && !existing.isDefault) {
        await setDefaultProvider(existing.id);
      }
      toast.success(t('setting.ai.providerUpdated'));
    } else {
      provider = (await createProvider({
        name: template.name,
        baseUrl: template.baseUrl,
        apiKey,
        model: template.defaultModel,
        isDefault: shouldUsePresetAsDefault(template.id),
      })) as AIProviderConfigClientDTO;
      toast.success(t('setting.ai.providerCreated'));
    }

    presetApiKeys[template.id] = '';
    await handleRefreshModels(String(provider.id));
  } catch (error) {
    toast.error(getAISettingErrorMessage(error, 'setting.ai.providerActionFailed'));
  } finally {
    quickProviderSubmittingId.value = null;
  }
}

async function submitProvider() {
  if (!canSubmitProvider.value) return;

  isSubmittingProvider.value = true;
  try {
    let savedProvider: AIProviderConfigClientDTO;
    if (editingProviderId.value) {
      savedProvider = (await updateProvider(editingProviderId.value, {
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        model: providerForm.model.trim(),
        ...(providerForm.apiKey.trim() ? { apiKey: providerForm.apiKey.trim() } : {}),
        isDefault: providerForm.isDefault,
      })) as AIProviderConfigClientDTO;
      toast.success(t('setting.ai.providerUpdated'));
    } else {
      savedProvider = (await createProvider({
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        apiKey: providerForm.apiKey.trim(),
        model: providerForm.model.trim(),
        isDefault: providerForm.isDefault,
      })) as AIProviderConfigClientDTO;
      toast.success(t('setting.ai.providerCreated'));
    }

    console.debug('[AISettings] submitProvider:saved', {
      providerId: savedProvider.id,
      baseUrl: savedProvider.baseUrl,
      defaultModel: savedProvider.defaultModel,
      isDefault: savedProvider.isDefault,
    });

    let hydratedProvider: ProviderListItem = savedProvider;
    try {
      hydratedProvider = (await refreshProviderModels(String(savedProvider.id))) as ProviderListItem;
    } catch (error) {
      console.debug('[AISettings] submitProvider:autoRefreshFailed', {
        providerId: savedProvider.id,
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }

    populateForm(hydratedProvider);
  } catch (error) {
    toast.error(getAISettingErrorMessage(error, 'setting.ai.providerActionFailed'));
  } finally {
    isSubmittingProvider.value = false;
  }
}

async function testProviderConnection() {
  if (!canTestProvider.value) return;

  isTestingProvider.value = true;
  try {
    providerTestResult.value = await testProvider({
      baseUrl: providerForm.baseUrl.trim(),
      apiKey: providerForm.apiKey.trim(),
      model: providerForm.model.trim(),
    });

    if (providerTestResult.value.ok) {
      toast.success(t('setting.ai.providerTestPassed'));
    } else {
      toast.error(
        getAISettingErrorMessage(
          providerTestResult.value.error
            ? { message: providerTestResult.value.error }
            : null,
          'setting.ai.providerTestFailed',
        ),
      );
    }
  } catch (error) {
    toast.error(getAISettingErrorMessage(error, 'setting.ai.providerTestFailed'));
  } finally {
    isTestingProvider.value = false;
  }
}

async function handleSetDefault(providerId: string) {
  try {
    await setDefaultProvider(providerId);
    toast.success(t('setting.ai.providerDefaultUpdated'));
  } catch (error) {
    toast.error(getAISettingErrorMessage(error, 'setting.ai.providerActionFailed'));
  }
}

async function handleDeleteProvider(providerId: string) {
  try {
    await deleteProvider(providerId);
    toast.success(t('setting.ai.providerDeleted'));
    if (editingProviderId.value === providerId) {
      resetProviderForm();
    }
  } catch (error) {
    toast.error(getAISettingErrorMessage(error, 'setting.ai.providerActionFailed'));
  }
}
</script>
