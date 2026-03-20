<template>
  <div class="flex h-full overflow-hidden bg-background">
    <!-- Sidebar: Groups -->
    <aside class="hidden w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <BellRing class="h-5 w-5 text-primary" />
          <span>{{ t('reminder.title') }}</span>
        </div>

        <div class="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('reminder.action.createReminder')"
            @click="handleCreateTemplate()"
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
              class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedGroupId === group.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              "
              @click="selectedGroupId = group.id"
            >
              <Folder class="h-4 w-4" />
              <span class="truncate">{{ group.name }}</span>
            </div>
          </ActionableWrapper>
        </div>
      </ScrollArea>
    </aside>

    <!-- Main -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
      >
        <h1 class="text-lg font-medium text-foreground">
          {{ t('reminder.linear.templateTitle') }}
        </h1>
        <div class="flex items-center gap-2">
          <div class="relative hidden w-64 lg:block">
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
            <Button @click="handleCreateTemplate">
              <Plus class="mr-2 h-4 w-4" /> {{ t('reminder.action.createReminder') }}
            </Button>
          </div>

          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <GridTemplateItem
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              :item="tpl"
              @click="handleTemplateClick"
              @edit="handleEditTemplate"
              @delete="handleDeleteTemplate"
              @toggle-enabled="handleToggleEnabled"
            />
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Template Detail Card -->
    <TemplateDesktopCard
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
} from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Input, useConfirm } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import GridTemplateItem from '../components/GridTemplateItem.vue';
import TemplateDesktopCard from '../components/TemplateDesktopCard.vue';
import TemplateDialog from '../components/TemplateDialog.vue';
import GroupDialog from '../components/GroupDialog.vue';
import { useReminder } from '../composables/useReminder';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';
import type { ReminderGroupFormModel } from '../types';

const {
  templates,
  groups,
  isLoading,
  isSaving,
  fetchTemplates,
  fetchGroups,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createGroup,
  updateGroup,
  deleteGroup,
} = useReminder();

const { t } = useI18n();

const selectedGroupId = ref<string | null>(null);
const searchQuery = ref('');
const selectedTemplate = ref<ReminderTemplateClientDTO | null>(null);
const editingTemplate = ref<ReminderTemplateClientDTO | null>(null);
const defaultTemplateGroupId = ref<string | null>(null);
const templateCardRef = ref<any>(null);
const templateDialogRef = ref<any>(null);
const groupDialogRef = ref<any>(null);
const editingGroup = ref<ReminderGroupClientDTO | null>(null);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- component-local ReminderTemplate type
function handleTemplateClick(tpl: any) {
  selectedTemplate.value = templates.value.find((t) => t.id === tpl.id) || null;
  templateCardRef.value?.open();
}

function handleCreateTemplate(groupId?: string | null) {
  editingTemplate.value = null;
  defaultTemplateGroupId.value = groupId ?? null;
  templateDialogRef.value?.openForCreate();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleEditTemplate(tpl: any) {
  const found = templates.value.find((t) => t.id === tpl.id);
  if (found) {
    editingTemplate.value = found;
    defaultTemplateGroupId.value = null;
    templateDialogRef.value?.openForEdit(found);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDeleteTemplate(tpl: any) {
  const template = templates.value.find((t) => t.id === tpl.id);
  if (!template) return;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleToggleEnabled(tpl: any) {
  const template = templates.value.find((t) => t.id === tpl.id);
  if (template) {
    updateTemplate(template.id, {});
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleStatusChanged(tpl: any, _enabled: boolean) {
  const template = templates.value.find((t) => t.id === tpl.id);
  if (template) {
    updateTemplate(template.id, {});
  }
}

async function handleSaveTemplate(data: Record<string, unknown>) {
  const result = await createTemplate(data as any);
  if (result) {
    defaultTemplateGroupId.value = null;
    toast.success(t('reminder.toast.templateCreated'));
    templateDialogRef.value?.close();
  }
}

async function handleUpdateTemplate(id: string, data: Record<string, unknown>) {
  const result = await updateTemplate(id, data as any);
  if (result) {
    defaultTemplateGroupId.value = null;
    toast.success(t('reminder.toast.templateUpdated'));
    templateDialogRef.value?.close();
  }
}

async function handleSaveGroup(data: Record<string, unknown>) {
  const result = await createGroup(data as any);
  if (result) {
    toast.success(t('reminder.toast.groupCreated'));
    groupDialogRef.value?.close();
  }
}

async function handleUpdateGroup(id: string, data: Record<string, unknown>) {
  const result = await updateGroup(id, data as any);
  if (result) {
    toast.success(t('reminder.toast.groupUpdated'));
    groupDialogRef.value?.close();
  }
  await fetchGroups();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getGroupActions(group: ReminderGroupFormModel): MenuAction[] {
  return [
    {
      key: 'createReminder',
      label: menuLabel('createReminder'),
      icon: Plus,
      handler: () => handleCreateTemplate(group.id),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleEditGroup(group: ReminderGroupFormModel) {
  editingGroup.value = group as ReminderGroupClientDTO;
  groupDialogRef.value?.openForEdit(group);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDeleteGroup(group: ReminderGroupFormModel) {
  if (!group.id) return;
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
  await Promise.all([fetchTemplates(), fetchGroups()]);
});
</script>
