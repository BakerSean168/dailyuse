<template>
  <div class="flex h-full min-h-0 w-full overflow-hidden bg-background">
    <!-- Sidebar -->
    <aside class="hidden min-h-0 w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <Target class="h-5 w-5 text-primary" />
          <span>{{ t('nav.goals') }}</span>
        </div>

        <div class="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('goal.list.newGoal')"
            data-testid="create-goal-button"
            @click="openCreateDialog()"
          >
            <Plus class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('goal.list.newFolder')"
            @click="openCreateFolder()"
          >
            <FolderPlus class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="space-y-1 p-2">
          <div
            v-for="view in visibleSystemViews"
            :key="view.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="
              selectedSystemView === view.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            "
            @click="selectSystemView(view.id)"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>{{ view.label }}</span>
            <Badge
              v-if="selectedSystemView === view.id"
              variant="secondary"
              class="ml-auto text-xs"
            >
              {{ view.count }}
            </Badge>
          </div>

          <ActionableWrapper
            v-for="folder in goalFolders"
            :key="folder.id"
            :actions="getFolderActions(folder)"
            :show-more-button="false"
          >
            <div
              class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedFolderId === folder.id && selectedSystemView === 'active'
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              "
              @click="
                selectedFolderId = folder.id;
                selectedSystemView = 'active';
                setSystemView('active');
              "
            >
              <span
                class="h-2.5 w-2.5 rounded-full border border-border/60"
                :style="{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }"
              />
              <Folder class="h-4 w-4" :style="{ color: folder.color || undefined }" />
              <span class="truncate">{{ folder.name }}</span>
            </div>
          </ActionableWrapper>
        </div>
      </ScrollArea>
    </aside>

    <!-- Main Content -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden" data-testid="goal-list-view">
      <!-- Header -->
      <header
        class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
      >
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-medium text-foreground">{{ activeViewLabel }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative mr-2 hidden w-64 lg:block">
            <Search
              class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('goal.list.searchGoals')"
              class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
              @input="search(searchQuery)"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-2"
            @click="$router.push({ name: 'goal-comparison' })"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>{{ t('goal.list.compare') }}</span>
          </Button>
        </div>
      </header>

      <!-- Content Area -->
      <ScrollArea class="min-h-0 flex-1 p-6">
        <div class="mx-auto max-w-7xl">
          <div
            v-if="isLoading"
            class="flex h-[50vh] items-center justify-center text-muted-foreground"
          >
            {{ t('goal.list.loading') }}
          </div>

          <div
            v-else-if="filteredGoals.length > 0"
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="goal-list"
          >
            <GoalCard
              v-for="goal in filteredGoals"
              :key="goal.id"
              :goal="goal"
              @view="handleViewGoal(goal)"
              @edit="handleEditGoal(goal)"
              @delete="handleDeleteGoal(goal.id)"
            />
          </div>

          <div
            v-else
            class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
          >
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Target class="h-6 w-6 opacity-50" />
            </div>
            <h3 class="mb-1 text-lg font-medium text-foreground">
              {{ t('goal.list.noGoalsFound') }}
            </h3>
            <p class="mb-6 text-sm">{{ t('goal.list.createToStart') }}</p>
            <Button data-testid="create-goal-button" @click="openCreateDialog()">
              <Plus class="mr-2 h-4 w-4" />
              {{ t('goal.list.createGoal') }}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Goal Dialog -->
    <GoalDialog
      v-model:open="showGoalDialog"
      :mode="dialogMode"
      :goal="editingGoal"
      :default-folder-id="defaultGoalFolderId"
      @created="handleGoalCreated"
      @updated="handleGoalUpdated"
    />

    <!-- Folder Dialog -->
    <GoalFolderDialog ref="folderDialogRef" @save="handleFolderSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import type { CreateGoalFolderReq, UpdateGoalFolderReq } from '@dailyuse/contracts/goal';
import type { GoalFolderId } from '@dailyuse/contracts/primitives';
import {
  Target,
  Plus,
  LayoutGrid,
  Search,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Input, useConfirm } from '@dailyuse/ui-vue-shadcn';
import { GoalCard, GoalDialog, GoalFolderDialog } from '../components';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO, GoalFolderClientDTO, GoalSystemView } from '@dailyuse/contracts/goal';

const { t } = useI18n();
const router = useRouter();

const {
  goals,
  goalFolders,
  isLoading,
  fetchGoals,
  fetchFolders,
  deleteGoal,
  deleteFolder,
  createFolder,
  updateFolder,
  setSystemView,
  search,
} = useGoal();

const selectedFolderId = ref<string | null>(null);
const selectedSystemView = ref<GoalSystemView>('active');
const searchQuery = ref('');
const showGoalDialog = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingGoal = ref<GoalClientDTO | null>(null);
const defaultGoalFolderId = ref<string | null>(null);
const folderDialogRef = ref<InstanceType<typeof GoalFolderDialog> | null>(null);

const systemViews = computed(() => [
  {
    id: 'active' as GoalSystemView,
    label: t('goal.systemFolders.active'),
    count: goals.value.length,
  },
  {
    id: 'completed' as GoalSystemView,
    label: t('goal.systemFolders.completed'),
    count: goals.value.filter((g) => !!g.archivedAt && !!g.completedAt && !g.deletedAt).length,
  },
  {
    id: 'expired' as GoalSystemView,
    label: t('goal.systemFolders.expired'),
    count: goals.value.filter((g) => !!g.archivedAt && !g.completedAt && !g.deletedAt).length,
  },
  {
    id: 'deleted' as GoalSystemView,
    label: t('goal.systemFolders.deleted'),
    count: goals.value.filter((g) => !!g.deletedAt).length,
  },
]);

const visibleSystemViews = computed(() => systemViews.value);

const activeViewLabel = computed(
  () =>
    systemViews.value.find((view) => view.id === selectedSystemView.value)?.label ??
    t('goal.systemFolders.active'),
);

const filteredGoals = computed(() => {
  let result = goals.value;

  if (selectedFolderId.value) {
    result = result.filter((g) => g.folderId === selectedFolderId.value);
  }
  return result;
});

function selectSystemView(view: GoalSystemView) {
  selectedSystemView.value = view;
  selectedFolderId.value = null;
  setSystemView(view);
}

function openCreateDialog(folderIdOrEvent?: string | Event | null) {
  const resolvedFolderId =
    folderIdOrEvent === null
      ? null
      : typeof folderIdOrEvent === 'string'
        ? folderIdOrEvent
        : selectedSystemView.value === 'active'
          ? selectedFolderId.value
          : null;

  editingGoal.value = null;
  dialogMode.value = 'create';
  defaultGoalFolderId.value = resolvedFolderId ?? null;
  showGoalDialog.value = true;
}

function handleViewGoal(goal: GoalClientDTO) {
  router.push({ name: 'goal-detail', params: { id: goal.id } });
}

function handleEditGoal(goal: GoalClientDTO) {
  editingGoal.value = goal;
  dialogMode.value = 'edit';
  defaultGoalFolderId.value = null;
  showGoalDialog.value = true;
}

async function handleDeleteGoal(id: string) {
  const confirmed = await useConfirm({
    title: t('goal.list.confirmDeleteTitle'),
    description: t('goal.list.confirmDelete'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await deleteGoal(id);
  if (ok) toast.success(t('goal.list.deleted'));
}

function handleGoalCreated() {
  showGoalDialog.value = false;
  defaultGoalFolderId.value = null;
  fetchGoals();
  toast.success(t('goal.list.created'));
}

function handleGoalUpdated() {
  showGoalDialog.value = false;
  defaultGoalFolderId.value = null;
  fetchGoals();
  toast.success(t('goal.list.updated'));
}

function getFolderActions(folder: GoalFolderClientDTO): MenuAction[] {
  return [
    {
      key: 'createGoal',
      label: menuLabel('createGoal'),
      icon: Plus,
      handler: () => openCreateDialog(folder.id),
    },
    {
      key: 'edit',
      label: menuLabel('editFolder'),
      icon: Pencil,
      handler: () => handleEditFolder(folder),
    },
    {
      key: 'delete',
      label: menuLabel('deleteFolder'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => handleDeleteFolder(folder.id),
    },
  ];
}

function handleEditFolder(folder: GoalFolderClientDTO) {
  folderDialogRef.value?.openForEdit(folder);
}

async function handleDeleteFolder(id: string) {
  const folder = goalFolders.value.find((item) => item.id === id);
  const confirmed = await useConfirm({
    title: t('goal.folder.confirmDeleteTitle'),
    description: t('goal.folder.confirmDelete', { name: folder?.name ?? '' }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await deleteFolder(id);
  if (ok) {
    if (selectedFolderId.value === id) selectedFolderId.value = null;
    toast.success(t('goal.folder.deleted'));
    await fetchGoals();
  }
}

async function handleFolderSaved(payload: any) {
  if (payload.id) {
    const ok = await updateFolder(payload.id, toUpdateFolderPayload(payload));
    if (ok) toast.success(t('goal.list.updated'));
  } else {
    const ok = await createFolder(toCreateFolderPayload(payload));
    if (ok) toast.success(t('goal.list.created'));
  }
  await fetchFolders();
}

function toCreateFolderPayload(payload: {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentFolderId?: string | null;
}): CreateGoalFolderReq {
  return {
    name: payload.name.trim(),
    description: payload.description ?? undefined,
    icon: payload.icon ?? undefined,
    color: payload.color ?? undefined,
    parentFolderId: (payload.parentFolderId ?? undefined) as GoalFolderId | undefined,
  };
}

function toUpdateFolderPayload(payload: {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentFolderId?: string | null;
}): UpdateGoalFolderReq {
  return {
    name: payload.name?.trim(),
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    color: payload.color ?? null,
    parentFolderId: (payload.parentFolderId ?? null) as GoalFolderId | null,
  };
}

function openCreateFolder() {
  folderDialogRef.value?.openForCreate();
}

onMounted(async () => {
  setSystemView(selectedSystemView.value);
  await Promise.all([fetchGoals(), fetchFolders()]);
});
</script>
