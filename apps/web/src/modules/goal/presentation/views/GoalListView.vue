<template>
  <div class="flex h-screen w-full overflow-hidden bg-background">
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-sidebar flex flex-col hidden md:flex">
      <div class="p-4 border-b h-14 flex items-center">
        <div class="flex items-center gap-2 font-semibold">
          <Target class="h-5 w-5 text-primary" />
          <span>Goals</span>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="p-2">
          <GoalFolderComponent
            :goal-folders="mockFolders"
            :selected-folder-id="selectedDirUuid"
            @select="onSelectedGoalFolder"
            @create="mockAction('Create Folder')"
          />
        </div>
      </ScrollArea>

      <div class="p-4 border-t text-xs text-muted-foreground">
        Workspace: Personal
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-6 flex-shrink-0 bg-background/50 backdrop-blur-sm z-10">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-medium text-foreground">Overview</h1>
          <div class="h-4 w-[1px] bg-border mx-2"></div>
          <div class="flex items-center gap-1">
            <Button
              v-for="tab in statusTabs"
              :key="tab.value"
              variant="ghost"
              size="sm"
              :class="['h-7 px-2 text-muted-foreground hover:text-foreground', selectedStatusIndex === statusTabs.indexOf(tab) ? 'bg-secondary text-foreground font-medium' : '']"
              @click="selectedStatusIndex = statusTabs.indexOf(tab)"
            >
              {{ tab.label }}
              <span class="ml-1.5 text-xs opacity-50">{{ getGoalCountByStatus(tab.value) }}</span>
            </Button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative w-64 mr-2 hidden lg:block">
            <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              class="h-8 pl-8 w-full bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-ring"
            />
          </div>

          <Button variant="outline" size="sm" class="h-8 gap-2" @click="mockAction('Compare Goals')">
            <LayoutGrid class="h-4 w-4" />
            <span>Compare</span>
          </Button>

          <Button size="sm" class="h-8 gap-2" @click="goalDialogRef?.openForCreate()">
            <Plus class="h-4 w-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </header>

      <!-- Content Area -->
      <ScrollArea class="flex-1 p-6">
        <div class="max-w-7xl mx-auto">
          <div v-if="filteredGoals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GoalCard
              v-for="goal in filteredGoals"
              :key="goal.uuid"
              :goal="goal"
              @edit="mockAction('Edit Goal')"
              @delete="mockAction('Delete Goal')"
            />
          </div>

          <div v-else class="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
            <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Target class="h-6 w-6 opacity-50" />
            </div>
            <h3 class="text-lg font-medium text-foreground mb-1">No goals found</h3>
            <p class="text-sm mb-6">Create a new goal to get started with tracking.</p>
            <Button @click="goalDialogRef?.openForCreate()">
              <Plus class="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Dialogs -->
    <GoalDialog ref="goalDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Button,
  ScrollArea,
  Input,
  Separator,
  Badge
} from '@dailyuse/ui-vue-shadcn';
import {
  Target,
  Plus,
  LayoutGrid,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import GoalCard from '../components/cards/GoalCard.vue';
import GoalFolderComponent from '../components/GoalFolder.vue';
import GoalDialog from '../components/dialogs/GoalDialog.vue';

// --- Mock Data ---

const mockFolders = [
  { uuid: 'all', name: 'All Goals', icon: 'LayoutGrid', count: 12 },
  { uuid: 'q1', name: 'Q1 2024', icon: 'Folder', count: 5 },
  { uuid: 'q2', name: 'Q2 2024', icon: 'Folder', count: 3 },
  { uuid: 'marketing', name: 'Marketing', icon: 'Folder', count: 2 },
  { uuid: 'product', name: 'Product', icon: 'Folder', count: 2 },
  { uuid: 'archived', name: 'Archived', icon: 'Archive', count: 4 },
];

const mockGoals = [
  {
    uuid: '1',
    title: 'Increase Monthly Active Users to 50k',
    description: 'Focus on retention and referral programs to boost organic growth.',
    status: 'ACTIVE',
    statusText: 'On Track',
    color: '#5E6AD2', // Linear-like purple
    overallProgress: 65,
    startDate: '2024-01-01',
    targetDate: '2024-03-31',
    daysRemaining: 45,
    keyResultCount: 3,
    completedKeyResultCount: 1,
    isOverdue: false,
    isCompleted: false,
    isArchived: false,
    owner: { name: 'Alice', avatar: '' },
    team: 'Product'
  },
  {
    uuid: '2',
    title: 'Launch Mobile App v2.0',
    description: 'Complete redesign of the mobile experience with new navigation.',
    status: 'ACTIVE',
    statusText: 'At Risk',
    color: '#F5A623', // Warning orange
    overallProgress: 30,
    startDate: '2024-02-01',
    targetDate: '2024-04-15',
    daysRemaining: 60,
    keyResultCount: 5,
    completedKeyResultCount: 0,
    isOverdue: false,
    isCompleted: false,
    isArchived: false,
    owner: { name: 'Bob', avatar: '' },
    team: 'Engineering'
  },
  {
    uuid: '3',
    title: 'Close $1M in Series A Funding',
    description: 'Secure funding to scale operations and hire key talent.',
    status: 'COMPLETED',
    statusText: 'Completed',
    color: '#27AE60', // Success green
    overallProgress: 100,
    startDate: '2023-10-01',
    targetDate: '2024-01-15',
    daysRemaining: 0,
    keyResultCount: 2,
    completedKeyResultCount: 2,
    isOverdue: false,
    isCompleted: true,
    isArchived: false,
    owner: { name: 'Charlie', avatar: '' },
    team: 'Executive'
  },
  {
    uuid: '4',
    title: 'Establish Design System',
    description: 'Create a unified design language across web and mobile platforms.',
    status: 'DRAFT',
    statusText: 'Paused',
    color: '#95A5A6', // Gray
    overallProgress: 15,
    startDate: '2024-03-01',
    targetDate: '2024-06-30',
    daysRemaining: 120,
    keyResultCount: 4,
    completedKeyResultCount: 0,
    isOverdue: false,
    isCompleted: false,
    isArchived: false,
    owner: { name: 'Diana', avatar: '' },
    team: 'Design'
  },
  {
    uuid: '5',
    title: 'Customer Satisfaction Score > 90',
    description: 'Improve support response times and ticket resolution quality.',
    status: 'ACTIVE',
    statusText: 'On Track',
    color: '#5E6AD2',
    overallProgress: 88,
    startDate: '2024-01-01',
    targetDate: '2024-12-31',
    daysRemaining: 300,
    keyResultCount: 1,
    completedKeyResultCount: 0,
    isOverdue: false,
    isCompleted: false,
    isArchived: false,
    owner: { name: 'Eve', avatar: '' },
    team: 'Support'
  }
];

// --- State ---

const selectedDirUuid = ref('all');
const selectedStatusIndex = ref(0);
const goalDialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
];

// --- Computed ---

const filteredGoals = computed(() => {
  let result = mockGoals;

  // Folder filter
  if (selectedDirUuid.value !== 'all') {
    if (selectedDirUuid.value === 'archived') {
       // Mock archived logic
       return [];
    }
    // Mock folder filtering logic (just return subset for demo)
    result = mockGoals.filter((_, i) => i % 2 === 0);
  }

  // Status filter
  const currentTab = statusTabs[selectedStatusIndex.value];
  if (currentTab.value === 'active') {
    result = result.filter(g => g.status === 'ACTIVE');
  } else if (currentTab.value === 'paused') {
    result = result.filter(g => g.status === 'DRAFT');
  } else if (currentTab.value === 'completed') {
    result = result.filter(g => g.status === 'COMPLETED');
  }

  return result;
});

// --- Methods ---

const getGoalCountByStatus = (status: string) => {
  if (status === 'all') return mockGoals.length;
  if (status === 'active') return mockGoals.filter(g => g.status === 'ACTIVE').length;
  if (status === 'paused') return mockGoals.filter(g => g.status === 'DRAFT').length;
  if (status === 'completed') return mockGoals.filter(g => g.status === 'COMPLETED').length;
  return 0;
};

const onSelectedGoalFolder = (uuid: string) => {
  selectedDirUuid.value = uuid;
};

const mockAction = (name: string) => {
  toast.info(`Action triggered: ${name}`, {
    description: 'This is a mock action for the UI demo.'
  });
};

</script>

<style scoped>
/* Scoped styles if needed, but Tailwind handles most */
</style>
