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

          <div
            v-for="folder in goalFolders"
            :key="folder.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="
              selectedFolderId === folder.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            "
            @click="selectedFolderId = folder.id"
          >
            <Folder class="h-4 w-4" />
            <span class="truncate">{{ folder.name }}</span>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start"
          @click="showGoalDialog = true"
        >
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

          <Button size="sm" class="h-8 gap-2" @click="showGoalDialog = true">
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
            加载中...
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
            <Button @click="showGoalDialog = true">
              <Plus class="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Goal Dialog -->
    <GoalDialog v-model:open="showGoalDialog" @created="handleGoalCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { Target, Plus, LayoutGrid, Search, Folder, FolderPlus } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Input, Separator } from '@dailyuse/ui-vue-shadcn';
import { GoalCard, GoalDialog } from '../components';
import { useGoal } from '../composables/useGoal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

const {
  goals,
  goalFolders,
  isLoading,
  fetchGoals,
  fetchFolders,
  deleteGoal,
  setFilterStatus,
  search,
} = useGoal();

const selectedFolderId = ref<string | null>(null);
const selectedStatus = ref('all');
const searchQuery = ref('');
const showGoalDialog = ref(false);

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

function handleEditGoal(goal: GoalClientDTO) {
  toast.info(`Edit goal: ${goal.name}`);
}

async function handleDeleteGoal(id: string) {
  if (!window.confirm('确认删除此目标？')) return;
  const ok = await deleteGoal(id);
  if (ok) toast.success('目标已删除');
}

function handleGoalCreated() {
  showGoalDialog.value = false;
  fetchGoals();
  toast.success('目标已创建');
}

onMounted(async () => {
  await Promise.all([fetchGoals(), fetchFolders()]);
});
</script>
