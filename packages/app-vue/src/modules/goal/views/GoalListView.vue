<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- Sidebar -->
    <aside class="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <Target class="h-5 w-5 text-primary" />
          <span>Goals</span>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="space-y-1 p-2">
          <div
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="!selectedFolderId ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectedFolderId = null"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>All Goals</span>
            <Badge variant="secondary" class="ml-auto text-xs">{{ goals.length }}</Badge>
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
                selectedFolderId === folder.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              "
              @click="selectedFolderId = folder.id"
            >
              <Folder class="h-4 w-4" />
              <span class="truncate">{{ folder.name }}</span>
            </div>
          </ActionableWrapper>
        </div>
      </ScrollArea>

      <div class="border-t p-4">
        <Button variant="ghost" size="sm" class="w-full justify-start" @click="openCreateFolder">
          <FolderPlus class="mr-2 h-4 w-4" /> New Folder
        </Button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
      >
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-medium text-foreground">Overview</h1>
          <Separator orientation="vertical" class="mx-2 h-4" />
          <div class="flex items-center gap-1">
            <Button
              v-for="tab in statusTabs"
              :key="tab.value"
              variant="ghost"
              size="sm"
              :class="[
                'h-7 px-2 text-muted-foreground hover:text-foreground',
                selectedStatus === tab.value ? 'bg-secondary font-medium text-foreground' : '',
              ]"
              @click="selectedStatus = tab.value"
            >
              {{ tab.label }}
              <span class="ml-1.5 text-xs opacity-50">{{ getGoalCountByStatus(tab.value) }}</span>
            </Button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative mr-2 hidden w-64 lg:block">
            <Search
              class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search goals..."
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
            <span>Compare</span>
          </Button>

          <Button size="sm" class="h-8 gap-2" @click="openCreateDialog">
            <Plus class="h-4 w-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </header>

      <!-- Content Area -->
      <ScrollArea class="flex-1 p-6">
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
          >
            <GoalCard
              v-for="goal in filteredGoals"
              :key="goal.id"
              :goal="goal"
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
            <h3 class="mb-1 text-lg font-medium text-foreground">No goals found</h3>
            <p class="mb-6 text-sm">Create a new goal to get started with tracking.</p>
            <Button @click="openCreateDialog">
              <Plus class="mr-2 h-4 w-4" />
              Create Goal
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
      @created="handleGoalCreated"
      @updated="handleGoalUpdated"
    />

    <!-- Folder Dialog -->
    <GoalFolderDialog ref="folderDialogRef" @save="handleFolderSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
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
import { Button, Badge, ScrollArea, Input, Separator } from '@dailyuse/ui-vue-shadcn';
import { GoalCard, GoalDialog, GoalFolderDialog } from '../components';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO, GoalFolderClientDTO } from '@dailyuse/contracts/goal';

const { t } = useI18n();

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
  setFilterStatus,
  search,
} = useGoal();

const selectedFolderId = ref<string | null>(null);
const selectedStatus = ref('all');
const searchQuery = ref('');
const showGoalDialog = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingGoal = ref<GoalClientDTO | null>(null);
const folderDialogRef = ref<InstanceType<typeof GoalFolderDialog> | null>(null);

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Paused', value: 'Paused' },
  { label: 'Completed', value: 'Completed' },
];

const filteredGoals = computed(() => {
  let result = goals.value;

  if (selectedFolderId.value) {
    result = result.filter((g) => g.folderId === selectedFolderId.value);
  }

  if (selectedStatus.value !== 'all') {
    result = result.filter((g) => g.status === selectedStatus.value);
  }

  return result;
});

function getGoalCountByStatus(status: string): number {
  if (status === 'all') return goals.value.length;
  return goals.value.filter((g) => g.status === status).length;
}

function openCreateDialog() {
  editingGoal.value = null;
  dialogMode.value = 'create';
  showGoalDialog.value = true;
}

function handleEditGoal(goal: GoalClientDTO) {
  editingGoal.value = goal;
  dialogMode.value = 'edit';
  showGoalDialog.value = true;
}

async function handleDeleteGoal(id: string) {
  if (!window.confirm(t('goal.list.confirmDelete'))) return;
  const ok = await deleteGoal(id);
  if (ok) toast.success(t('goal.list.deleted'));
}

function handleGoalCreated() {
  showGoalDialog.value = false;
  fetchGoals();
  toast.success(t('goal.list.created'));
}

function handleGoalUpdated() {
  showGoalDialog.value = false;
  fetchGoals();
  toast.success(t('goal.list.updated'));
}

function getFolderActions(folder: GoalFolderClientDTO): MenuAction[] {
  return [
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
  if (!window.confirm(t('goal.folder.confirmDelete'))) return;
  const ok = await deleteFolder(id);
  if (ok) {
    if (selectedFolderId.value === id) selectedFolderId.value = null;
    toast.success(t('goal.folder.deleted'));
  }
}

async function handleFolderSaved(payload: any) {
  if (payload.id) {
    const ok = await updateFolder(payload.id, payload);
    if (ok) toast.success(t('goal.list.updated'));
  } else {
    const ok = await createFolder(payload);
    if (ok) toast.success(t('goal.list.created'));
  }
  await fetchFolders();
}

function openCreateFolder() {
  folderDialogRef.value?.openForCreate();
}

onMounted(async () => {
  await Promise.all([fetchGoals(), fetchFolders()]);
});
</script>
