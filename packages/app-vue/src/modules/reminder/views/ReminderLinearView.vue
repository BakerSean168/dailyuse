<template>
  <div
    class="flex h-full overflow-hidden bg-background"
    :class="isNarrow ? 'flex-col' : 'flex-row'"
  >
    <!-- 窄档（split）：分组侧栏收顶部下拉（V2 §6.4 / §7） -->
    <ReminderGroupSwitcherBar
      v-if="isNarrow"
      :groups="groups"
      :selected-group-id="selectedGroupId"
      :template-count="templates.length"
      @select-group="selectedGroupId = $event"
      @create-template="handleCreateTemplate(selectedGroupId)"
      @create-group="openCreateGroup()"
    />

    <!-- 宽档（focus）：完整分组侧栏 -->
    <aside
      v-else
      class="flex w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar"
      data-testid="reminder-group-sidebar"
    >
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <BellRing class="h-5 w-5 text-primary" />
          <span>{{ t('reminder.title') }}</span>
        </div>

        <div class="ml-auto flex items-center gap-1">
          <Button
            data-testid="create-reminder-template-button"
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('reminder.action.createReminder')"
            @click="() => handleCreateTemplate(selectedGroupId)"
          >
            <Plus class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('reminder.action.createGroup')"
            @click="openCreateGroup()"
          >
            <FolderPlus class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea class="min-h-0 flex-1">
        <div class="space-y-1 p-2">
          <div
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="!selectedGroupId ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectedGroupId = null"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>{{ t('reminder.linear.allReminders') }}</span>
            <Badge variant="secondary" class="ml-auto text-xs">{{ templates.length }}</Badge>
          </div>

          <ActionableWrapper
            v-for="group in groups"
            :key="group.id"
            :actions="getGroupActions(group)"
            :show-more-button="false"
          >
            <div
              class="flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedGroupId === group.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              "
              @click="selectedGroupId = group.id"
            >
              <Folder class="mt-0.5 h-4 w-4 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate">{{ group.name }}</span>
                  <Badge variant="outline" class="ml-auto shrink-0 text-[10px]">
                    {{ group.stats.totalTemplates }}
                  </Badge>
                </div>
                <p class="mt-1 line-clamp-2 text-[11px] text-muted-foreground/90">
                  {{ getSidebarGroupSummary(group) }}
                </p>
              </div>
            </div>
          </ActionableWrapper>
        </div>
      </ScrollArea>
    </aside>

    <!-- Main -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/50 px-4 backdrop-blur-sm @2xl/panel:px-6"
      >
        <h1 data-testid="reminder-linear-heading" class="truncate text-lg font-medium text-foreground">
          {{ t('reminder.linear.templateTitle') }}
        </h1>
        <div class="flex min-w-0 items-center gap-2">
          <!-- 全局开关任何档位保持面板头可达（V2 §6.4） -->
          <div
            class="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1.5 @2xl/panel:gap-3 @2xl/panel:px-3"
            data-testid="reminder-master-switch"
          >
            <span class="hidden text-xs text-muted-foreground @2xl/panel:inline">{{
              t('reminder.linear.masterSwitch')
            }}</span>
            <Switch
              :checked="preferences?.globalReminderEnabled ?? true"
              :disabled="isSaving"
              @update:checked="handleToggleGlobalReminder"
            />
          </div>
          <div class="relative hidden w-48 @3xl/panel:block @5xl/panel:w-64">
            <Search
              class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('reminder.linear.searchPlaceholder')"
              class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
            />
          </div>
        </div>
      </header>

      <ScrollArea class="min-h-0 flex-1 p-6">
        <div class="mx-auto max-w-5xl">
          <div
            v-if="preferences && !preferences.globalReminderEnabled"
            class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium">{{ t('reminder.linear.globalPausedTitle') }}</p>
                <p class="mt-1 text-xs text-amber-800">
                  {{ preferences.summaryText || t('reminder.linear.globalPausedDescription') }}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                class="border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100"
                :disabled="isSaving"
                @click="handleToggleGlobalReminder(true)"
              >
                {{ t('reminder.linear.reEnableGlobal') }}
              </Button>
            </div>
          </div>

          <div v-if="selectedGroup" class="mb-4 rounded-2xl border bg-card px-4 py-4 shadow-sm">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-sm font-semibold text-foreground">{{ selectedGroup.name }}</h2>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Badge variant="outline" class="cursor-help">
                      {{ getGroupControlModeText(t, selectedGroup) }}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-xs text-xs leading-5">
                    {{ getGroupPolicyText(t, selectedGroup) }}
                  </TooltipContent>
                </Tooltip>
                <Badge :variant="selectedGroup.enabled ? 'default' : 'secondary'">
                  {{
                    selectedGroup.enabled
                      ? t('reminder.linear.groupEnabled')
                      : t('reminder.linear.groupPaused')
                  }}
                </Badge>
              </div>
              <p v-if="selectedGroup.description" class="text-xs text-muted-foreground">
                {{ selectedGroup.description }}
              </p>
              <!-- 统计压成一行内联数字（§8-5） -->
              <p class="text-xs text-muted-foreground">
                {{ getGroupTemplateCountLabel(t, selectedGroup) }} ·
                {{ getGroupActiveStatusLabel(t, selectedGroup) }}
              </p>
            </div>
          </div>

          <div
            v-if="isLoading"
            class="flex h-[50vh] items-center justify-center text-muted-foreground"
          >
            {{ t('reminder.status.loading') }}
          </div>

          <div
            v-else-if="filteredTemplates.length === 0"
            class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
          >
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <BellRing class="h-6 w-6 opacity-50" />
            </div>
            <h3 class="mb-1 text-lg font-medium text-foreground">{{ t('reminder.empty') }}</h3>
            <p class="mb-6 text-sm">{{ t('reminder.emptyDescription') }}</p>
            <Button
              data-testid="create-first-reminder-template-button"
              @click="() => handleCreateTemplate(selectedGroupId)"
            >
              <Plus class="mr-2 h-4 w-4" /> {{ t('reminder.action.createReminder') }}
            </Button>
          </div>

          <div
            v-else
            class="grid grid-cols-2 gap-4 @2xl/panel:grid-cols-3 @3xl/panel:grid-cols-4 @5xl/panel:grid-cols-5"
          >
            <GridTemplateItem
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              :item="tpl"
              @click="handleTemplateClick"
              @edit="handleEditTemplate"
              @delete="handleDeleteTemplate"
              @toggle-enabled="handleToggleEnabled"
              @move="handleMoveTemplate"
            />
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Template Detail Card -->
    <ReminderTemplateCard
      ref="templateCardRef"
      :template="selectedTemplate"
      @edit-template="handleEditTemplate"
      @status-changed="handleStatusChanged"
    />

    <!-- Dialogs -->
    <TemplateDialog
      ref="templateDialogRef"
      :template="editingTemplate"
      :group-options="groups"
      :default-group-id="defaultTemplateGroupId"
      :saving="isSaving"
      @save="handleSaveTemplate"
      @update="handleUpdateTemplate"
    />

    <GroupDialog
      ref="groupDialogRef"
      :group="editingGroup"
      :saving="isSaving"
      @save="handleSaveGroup"
      @update="handleUpdateGroup"
    />

    <TemplateMoveDialog
      ref="templateMoveDialogRef"
      :template="movingTemplate"
      :groups="groups"
      :templates="templates"
      @moved="handleTemplateMoved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
  BellRing,
  LayoutGrid,
  Folder,
  FolderPlus,
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
} from 'lucide-vue-next';
import {
  Badge,
  Button,
  Input,
  ScrollArea,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useConfirm,
} from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import GridTemplateItem from '../components/GridTemplateItem.vue';
import ReminderGroupSwitcherBar from '../components/ReminderGroupSwitcherBar.vue';
import ReminderTemplateCard from '../components/ReminderTemplateCard.vue';
import TemplateDialog from '../components/TemplateDialog.vue';
import GroupDialog from '../components/GroupDialog.vue';
import TemplateMoveDialog from '../components/TemplateMoveDialog.vue';
import { usePanelWidth } from '../../../layouts/shell/usePanelWidth';
import { useReminder } from '../composables/useReminder';
import {
  getGroupActiveStatusLabel,
  getGroupControlModeText,
  getGroupPolicyText,
  getGroupSidebarSummary,
  getGroupTemplateCountLabel,
} from '../presentation/lifecycle-presentation';
import type {
  ControlMode,
  CreateReminderGroupReq,
  CreateReminderTemplateReq,
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
  UpdateReminderGroupReq,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';

const {
  templates,
  groups,
  isLoading,
  isSaving,
  preferences,
  fetchTemplates,
  fetchGroups,
  fetchPreferences,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplate,
  moveTemplateToGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  toggleGroup,
  switchGroupControlMode,
  updatePreferences,
} = useReminder();

const { t } = useI18n();
// 面板两档（V2 §7）：窄档收分组侧栏为顶部下拉，宽档恢复完整侧栏；全局开关始终在面板头。
const { isNarrow } = usePanelWidth();

const selectedGroupId = ref<string | null>(null);
const searchQuery = ref('');
const selectedTemplateId = ref<string | null>(null);
const selectedTemplate = computed(
  () => templates.value.find((template) => template.id === selectedTemplateId.value) ?? null,
);
const editingTemplate = ref<ReminderTemplateClientDTO | null>(null);
const defaultTemplateGroupId = ref<string | null>(null);
const templateCardRef = ref<InstanceType<typeof ReminderTemplateCard> | null>(null);
const templateDialogRef = ref<InstanceType<typeof TemplateDialog> | null>(null);
const templateMoveDialogRef = ref<InstanceType<typeof TemplateMoveDialog> | null>(null);
const groupDialogRef = ref<InstanceType<typeof GroupDialog> | null>(null);
const editingGroup = ref<ReminderGroupClientDTO | null>(null);
const movingTemplate = ref<ReminderTemplateClientDTO | null>(null);

const filteredTemplates = computed(() => {
  let result = templates.value;
  if (selectedGroupId.value) {
    result = result.filter((t) => t.groupId === selectedGroupId.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
    );
  }
  return result;
});

const selectedGroup = computed(
  () => groups.value.find((group) => group.id === selectedGroupId.value) || null,
);

function getSidebarGroupSummary(group: ReminderGroupClientDTO) {
  return getGroupSidebarSummary(t, group, templates.value);
}

function handleTemplateClick(template: ReminderTemplateClientDTO) {
  selectedTemplateId.value = template.id;
  templateCardRef.value?.open();
}

function handleCreateTemplate(groupId?: string | null) {
  editingTemplate.value = null;
  defaultTemplateGroupId.value = groupId ?? selectedGroupId.value ?? null;
  templateDialogRef.value?.openForCreate();
}

function handleEditTemplate(template: ReminderTemplateClientDTO) {
  editingTemplate.value = template;
  defaultTemplateGroupId.value = null;
  templateDialogRef.value?.openForEdit(template);
}

async function handleDeleteTemplate(template: ReminderTemplateClientDTO) {
  const confirmed = await useConfirm({
    title: t('reminder.template.confirmDeleteTitle'),
    description: t('reminder.template.confirmDelete', { name: template.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await deleteTemplate(template.id);
  if (ok) toast.success(t('reminder.toast.templateDeleted'));
}

async function handleToggleEnabled(template: ReminderTemplateClientDTO) {
  const result = await toggleTemplate(template.id);
  if (result) {
    toast.success(
      result.effectiveEnabled
        ? t('reminder.toast.templateEnabled')
        : t('reminder.toast.templatePaused'),
    );
  }
}

async function handleStatusChanged(template: ReminderTemplateClientDTO, _enabled: boolean) {
  await handleToggleEnabled(template);
}

function handleMoveTemplate(template: ReminderTemplateClientDTO) {
  movingTemplate.value = template;
  templateMoveDialogRef.value?.open();
}

async function handleTemplateMoved(templateId: string, groupId: string | null) {
  const result = await moveTemplateToGroup(templateId, groupId);
  if (result) {
    toast.success(
      groupId ? t('reminder.toast.templateMoved') : t('reminder.toast.templateMovedToRoot'),
    );
    movingTemplate.value = null;
  }
}

async function handleToggleGlobalReminder(enabled: boolean) {
  const result = await updatePreferences({ globalReminderEnabled: enabled });
  if (result) {
    toast.success(
      enabled
        ? t('reminder.toast.globalReminderEnabled')
        : t('reminder.toast.globalReminderPaused'),
    );
  }
}

async function handleSaveTemplate(data: CreateReminderTemplateReq) {
  const result = await createTemplate(data);
  if (result) {
    defaultTemplateGroupId.value = null;
    toast.success(t('reminder.toast.templateCreated'));
    templateDialogRef.value?.close();
  }
}

async function handleUpdateTemplate(id: string, data: UpdateReminderTemplateReq) {
  const result = await updateTemplate(id, data);
  if (result) {
    defaultTemplateGroupId.value = null;
    toast.success(t('reminder.toast.templateUpdated'));
    templateDialogRef.value?.close();
  }
}

async function handleSaveGroup(data: CreateReminderGroupReq) {
  const result = await createGroup(data);
  if (result) {
    toast.success(t('reminder.toast.groupCreated'));
    groupDialogRef.value?.close();
  }
}

async function handleUpdateGroup(id: string, data: UpdateReminderGroupReq) {
  const result = await updateGroup(id, data);
  if (result) {
    toast.success(t('reminder.toast.groupUpdated'));
    groupDialogRef.value?.close();
  }
}

function getGroupActions(group: ReminderGroupClientDTO): MenuAction[] {
  return [
    {
      key: 'toggleGroup',
      label: group.enabled ? t('reminder.action.pauseGroup') : t('reminder.action.enableGroup'),
      icon: Power,
      handler: async () => {
        const result = await toggleGroup(group.id!);
        if (result) {
          toast.success(
            result.enabled ? t('reminder.toast.groupEnabled') : t('reminder.toast.groupPaused'),
          );
        }
      },
    },
    {
      key: 'createReminder',
      label: menuLabel('createReminder'),
      icon: Plus,
      handler: () => handleCreateTemplate(group.id),
    },
    {
      key: 'switchControlMode',
      label:
        group.controlMode === 'Group'
          ? t('reminder.action.switchToIndividual')
          : t('reminder.action.switchToGroup'),
      icon: Pencil,
      handler: async () => {
        const nextMode: ControlMode = group.controlMode === 'Group' ? 'Individual' : 'Group';
        const result = await switchGroupControlMode(group.id, nextMode);
        if (result) {
          toast.success(t('reminder.toast.groupControlModeUpdated'));
        }
      },
    },
    {
      key: 'edit',
      label: menuLabel('editGroup'),
      icon: Pencil,
      handler: () => handleEditGroup(group),
    },
    {
      key: 'delete',
      label: menuLabel('deleteGroup'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => handleDeleteGroup(group),
    },
  ];
}

function handleEditGroup(group: ReminderGroupClientDTO) {
  editingGroup.value = group;
  groupDialogRef.value?.openForEdit(group);
}

async function handleDeleteGroup(group: ReminderGroupClientDTO) {
  const confirmed = await useConfirm({
    title: t('reminder.group.confirmDeleteTitle'),
    description: t('reminder.group.confirmDelete', { name: group.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await deleteGroup(group.id);
  if (ok) {
    if (selectedGroupId.value === group.id) selectedGroupId.value = null;
    toast.success(t('reminder.toast.groupDeleted'));
  }
}

function openCreateGroup() {
  editingGroup.value = null;
  groupDialogRef.value?.open();
}

onMounted(async () => {
  await Promise.all([fetchTemplates(), fetchGroups(), fetchPreferences()]);
});
</script>
