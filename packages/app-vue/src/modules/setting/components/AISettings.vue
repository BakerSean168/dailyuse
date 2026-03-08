<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('setting.ai.title') }}</CardTitle>
      <CardDescription>{{ t('setting.ai.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="space-y-6">
          <div class="flex items-center justify-between gap-4">
            <div class="space-y-1">
              <Label class="text-base font-medium">{{ t('setting.ai.enabled') }}</Label>
              <p class="text-sm text-muted-foreground">{{ t('setting.ai.enabledDescription') }}</p>
            </div>
            <Switch
              :checked="preferences.enabled"
              :disabled="isSavingSettings"
              @update:checked="updateEnabled"
            />
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="space-y-1">
              <Label class="text-base font-medium">{{ t('setting.ai.showFloatingBall') }}</Label>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.showFloatingBallDescription') }}
              </p>
            </div>
            <Switch
              :checked="preferences.showFloatingBall"
              :disabled="isSavingSettings || !preferences.enabled"
              @update:checked="updateFloatingBall"
            />
          </div>

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
              :disabled="isSavingSettings || !preferences.enabled"
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
              <h3 class="text-base font-semibold">{{ t('setting.ai.providerSectionTitle') }}</h3>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.providerSectionDescription') }}
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
              v-for="provider in providers"
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
              v-if="!providers.length"
              class="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground"
            >
              {{ t('setting.ai.noProviders') }}
            </div>
          </div>

          <Separator />

          <div class="space-y-4">
            <div>
              <h4 class="font-medium">{{ t('setting.ai.providerFormTitle') }}</h4>
              <p class="text-sm text-muted-foreground">
                {{ t('setting.ai.providerFormDescription') }}
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
import { KnowledgeNoteSubpathSchema } from '@dailyuse/contracts/setting';
import { useUserSetting } from '../composables/useUserSetting';
import { useAI } from '../../ai/composables/useAI';

interface AIFormState {
  enabled: boolean;
  showFloatingBall: boolean;
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
  defaultModel?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
};

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
  testProvider,
} = useAI();

const fallbackState: AIFormState = {
  enabled: true,
  showFloatingBall: true,
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

const aiSettings = computed(() => getCategory('ai'));

watch(
  aiSettings,
  (value) => {
    preferences.value = {
      enabled: value?.enabled ?? fallbackState.enabled,
      showFloatingBall: value?.showFloatingBall ?? fallbackState.showFloatingBall,
      knowledgeNoteSubpath: value?.knowledgeNoteSubpath ?? fallbackState.knowledgeNoteSubpath,
    };
    draftSubpath.value = preferences.value.knowledgeNoteSubpath;
  },
  { immediate: true },
);

onMounted(() => {
  void loadProviders();
});

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
    !preferences.value.enabled ||
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
  return [providerTestResult.value.error, latency].filter(Boolean).join(' · ');
});

async function patchAISettings(patch: Partial<AIFormState>) {
  isSavingSettings.value = true;
  try {
    const nextState = { ...preferences.value, ...patch };
    const updated = await updateCategory('ai', nextState);
    if (!updated) return;

    preferences.value = {
      enabled: updated.preferences.ai.enabled,
      showFloatingBall: updated.preferences.ai.showFloatingBall,
      knowledgeNoteSubpath: updated.preferences.ai.knowledgeNoteSubpath,
    };
    draftSubpath.value = preferences.value.knowledgeNoteSubpath;
    toast.success(t('setting.ai.saved'));
  } finally {
    isSavingSettings.value = false;
  }
}

async function updateEnabled(value: boolean) {
  await patchAISettings({
    enabled: value,
    showFloatingBall: value ? preferences.value.showFloatingBall : false,
  });
}

async function updateFloatingBall(value: boolean) {
  await patchAISettings({ showFloatingBall: value });
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

async function submitProvider() {
  if (!canSubmitProvider.value) return;

  isSubmittingProvider.value = true;
  try {
    if (editingProviderId.value) {
      await updateProvider(editingProviderId.value, {
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        model: providerForm.model.trim(),
        ...(providerForm.apiKey.trim() ? { apiKey: providerForm.apiKey.trim() } : {}),
        isDefault: providerForm.isDefault,
      });
      toast.success(t('setting.ai.providerUpdated'));
    } else {
      await createProvider({
        name: providerForm.name.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        apiKey: providerForm.apiKey.trim(),
        model: providerForm.model.trim(),
        isDefault: providerForm.isDefault,
      });
      toast.success(t('setting.ai.providerCreated'));
    }

    resetProviderForm();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('setting.ai.providerActionFailed'));
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
      toast.error(providerTestResult.value.error || t('setting.ai.providerTestFailed'));
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('setting.ai.providerTestFailed'));
  } finally {
    isTestingProvider.value = false;
  }
}

async function handleSetDefault(providerId: string) {
  try {
    await setDefaultProvider(providerId);
    toast.success(t('setting.ai.providerDefaultUpdated'));
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('setting.ai.providerActionFailed'));
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
    toast.error(error instanceof Error ? error.message : t('setting.ai.providerActionFailed'));
  }
}
</script>
