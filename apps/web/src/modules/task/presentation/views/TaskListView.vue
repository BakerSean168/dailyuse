<script setup lang="ts">
/**
 * TaskListView - 任务列表视图
 *
 * Refactored to use Shadcn UI + Tailwind CSS (Linear Style).
 * Uses mock data for presentation layer.
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Button,
  Input,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  ScrollArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator
} from '@dailyuse/ui-vue-shadcn';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  LayoutList,
  Network
} from 'lucide-vue-next';

// --- Types ---
interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: { name: string; avatar?: string };
  dueDate?: string;
  project?: string;
}

const router = useRouter();

// --- State ---
const viewMode = ref<'list' | 'dag'>('list');
const searchQuery = ref('');
const statusFilter = ref<string>('all');

// --- Mock Data ---
const mockTasks: Task[] = [
  {
    id: 'TASK-123',
    title: 'Refactor Task Module UI',
    status: 'IN_PROGRESS',
    priority: 'high',
    assignee: { name: 'Jules', avatar: '' },
    dueDate: '2024-05-20',
    project: 'Frontend'
  },
  {
    id: 'TASK-124',
    title: 'Design System Implementation',
    status: 'DONE',
    priority: 'urgent',
    assignee: { name: 'Alice', avatar: '' },
    dueDate: '2024-05-10',
    project: 'Design'
  },
  {
    id: 'TASK-125',
    title: 'Update Authentication Flow',
    status: 'TODO',
    priority: 'medium',
    assignee: { name: 'Bob', avatar: '' },
    dueDate: '2024-06-01',
    project: 'Backend'
  },
  {
    id: 'TASK-126',
    title: 'Fix Navigation Bug',
    status: 'TODO',
    priority: 'low',
    assignee: { name: 'Charlie', avatar: '' },
    project: 'Maintenance'
  },
  {
    id: 'TASK-127',
    title: 'Write Documentation',
    status: 'IN_PROGRESS',
    priority: 'medium',
    dueDate: '2024-05-25',
    project: 'Docs'
  }
];

// --- Computed ---
const filteredTasks = computed(() => {
  return mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          task.id.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'all' || task.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// --- Methods ---
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DONE': return CheckCircle2;
    case 'IN_PROGRESS': return Circle; // Or a half-filled circle if available
    case 'CANCELED': return Circle;
    default: return Circle;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DONE': return 'text-primary'; // Linear uses purple/blue for done often, or green
    case 'IN_PROGRESS': return 'text-yellow-500';
    case 'CANCELED': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const getPriorityIconColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-blue-500';
    default: return 'text-muted-foreground';
  }
};

const handleTaskClick = (task: Task) => {
  router.push(`/tasks/${task.id}`);
};

const handleCreateTask = () => {
  console.log('Create task clicked');
};

</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground">
    <!-- Header -->
    <header class="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-background/50 backdrop-blur-sm z-10">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium">Tasks</h1>
        <Separator orientation="vertical" class="h-4" />

        <!-- View Toggles -->
        <div class="flex items-center bg-secondary/50 rounded-md p-0.5">
          <Button
            variant="ghost"
            size="sm"
            :class="['h-7 px-2.5', viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground']"
            @click="viewMode = 'list'"
          >
            <LayoutList class="w-4 h-4 mr-2" />
            List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="['h-7 px-2.5', viewMode === 'dag' ? 'bg-background shadow-sm' : 'text-muted-foreground']"
            @click="viewMode = 'dag'"
          >
            <Network class="w-4 h-4 mr-2" />
            Graph
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative w-64">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search tasks..."
            class="h-8 pl-8 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-ring"
          />
        </div>

        <!-- Filter -->
        <Button variant="outline" size="sm" class="h-8 gap-2">
          <Filter class="h-3.5 w-3.5" />
          <span>Filter</span>
        </Button>

        <Button size="sm" class="h-8 gap-2" @click="handleCreateTask">
          <Plus class="h-3.5 w-3.5" />
          <span>New Issue</span>
        </Button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden relative">
      <ScrollArea class="h-full">
        <!-- List View -->
        <div v-if="viewMode === 'list'" class="p-6 max-w-7xl mx-auto">
          <div class="border rounded-lg bg-card shadow-sm">
            <!-- Table Header -->
            <div class="grid grid-cols-12 gap-4 p-3 border-b text-xs font-medium text-muted-foreground">
              <div class="col-span-6 pl-2">Title</div>
              <div class="col-span-2">Status</div>
              <div class="col-span-2">Priority</div>
              <div class="col-span-2">Assignee</div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredTasks.length === 0" class="p-8 text-center text-muted-foreground">
              No tasks found.
            </div>

            <!-- Task Rows -->
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="grid grid-cols-12 gap-4 p-3 items-center border-b last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors group"
              @click="handleTaskClick(task)"
            >
              <!-- Title Column -->
              <div class="col-span-6 flex items-center gap-3 pl-2 overflow-hidden">
                <span class="text-xs text-muted-foreground font-mono shrink-0">{{ task.id }}</span>
                <span class="font-medium truncate text-sm text-foreground">{{ task.title }}</span>
                <Badge v-if="task.project" variant="outline" class="text-[10px] h-5 px-1.5 font-normal bg-secondary/50 text-muted-foreground border-transparent">
                  {{ task.project }}
                </Badge>
              </div>

              <!-- Status Column -->
              <div class="col-span-2 flex items-center gap-2">
                <component :is="getStatusIcon(task.status)" class="w-4 h-4" :class="getStatusColor(task.status)" />
                <span class="text-sm capitalize">{{ task.status.toLowerCase().replace('_', ' ') }}</span>
              </div>

              <!-- Priority Column -->
              <div class="col-span-2 flex items-center gap-2">
                <div class="w-2 h-2 rounded-sm" :class="getPriorityIconColor(task.priority)" />
                <span class="text-sm capitalize">{{ task.priority }}</span>
              </div>

              <!-- Assignee Column -->
              <div class="col-span-2 flex items-center justify-between pr-2">
                <div class="flex items-center gap-2" v-if="task.assignee">
                  <Avatar class="h-6 w-6">
                    <AvatarImage :src="task.assignee.avatar" />
                    <AvatarFallback class="text-[10px]">{{ task.assignee.name.substring(0, 2).toUpperCase() }}</AvatarFallback>
                  </Avatar>
                  <span class="text-sm truncate">{{ task.assignee.name }}</span>
                </div>
                <div v-else class="text-sm text-muted-foreground">-</div>

                <Button variant="ghost" size="icon" class="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- DAG View Placeholder -->
        <div v-else class="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
          <div class="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Network class="h-8 w-8 opacity-50" />
          </div>
          <h3 class="text-lg font-medium text-foreground">Graph View</h3>
          <p class="text-sm">Dependency visualization needs to be refactored.</p>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
