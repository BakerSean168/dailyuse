<script setup lang="ts">
/**
 * TaskDetailView - 任务详情视图
 *
 * Refactored to use Shadcn UI + Tailwind CSS (Linear Style).
 * Uses Sheet (Side Drawer) pattern.
 */
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Button,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator
} from '@dailyuse/ui-vue-shadcn';
import {
  X,
  Calendar,
  Flag,
  User,
  CheckCircle2,
  Circle,
  MoreHorizontal
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const router = useRouter();
const route = useRoute();
const isOpen = ref(false);

// --- Mock Data ---
const task = ref({
  id: 'TASK-123',
  title: 'Refactor Task Module UI',
  description: 'Convert existing Vuetify components to Shadcn UI. Ensure consistent design with Linear style.',
  status: 'IN_PROGRESS',
  priority: 'high',
  assignee: { name: 'Jules', avatar: '' },
  dueDate: '2024-05-20',
  createdAt: '2024-05-01',
  project: 'Frontend'
});

// --- Methods ---
onMounted(() => {
  // Simulate opening animation
  setTimeout(() => {
    isOpen.value = true;
  }, 100);
});

const handleClose = (open: boolean) => {
  if (!open) {
    isOpen.value = false;
    setTimeout(() => {
      router.back();
    }, 300);
  }
};

const handleSave = () => {
  toast.success('Task updated');
  // Logic to save
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this task?')) {
    toast.success('Task deleted');
    handleClose(false);
  }
};

</script>

<template>
  <Sheet :open="isOpen" @update:open="handleClose">
    <SheetContent class="w-[400px] sm:w-[540px] flex flex-col h-full p-0 gap-0 border-l border-border bg-background shadow-xl">

      <!-- Header -->
      <div class="h-14 flex items-center justify-between px-6 border-b shrink-0">
        <div class="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          {{ task.id }}
          <Badge variant="outline" class="font-normal">{{ task.project }}</Badge>
        </div>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
          <!-- Using standard SheetClose button logic, or custom close -->
           <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="handleClose(false)">
            <X class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 space-y-6">

          <!-- Title -->
          <div class="space-y-2">
            <Input
              v-model="task.title"
              class="text-lg font-semibold border-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
              placeholder="Task title"
            />
          </div>

          <!-- Properties Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Status -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-muted-foreground">Status</label>
              <Select v-model="task.status">
                <SelectTrigger class="h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Todo</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Priority -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-muted-foreground">Priority</label>
              <Select v-model="task.priority">
                <SelectTrigger class="h-8">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Assignee -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-muted-foreground">Assignee</label>
              <Button variant="outline" class="w-full justify-start font-normal h-8 px-3">
                <Avatar class="h-4 w-4 mr-2">
                  <AvatarFallback>JU</AvatarFallback>
                </Avatar>
                {{ task.assignee.name }}
              </Button>
            </div>

            <!-- Due Date -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-muted-foreground">Due Date</label>
              <Button variant="outline" class="w-full justify-start font-normal h-8 px-3 text-muted-foreground">
                <Calendar class="mr-2 h-4 w-4" />
                {{ task.dueDate || 'No due date' }}
              </Button>
            </div>
          </div>

          <Separator />

          <!-- Description -->
          <div class="space-y-2">
            <label class="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              v-model="task.description"
              placeholder="Add a description..."
              class="min-h-[200px] resize-none"
            />
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t bg-secondary/20 shrink-0 flex justify-end gap-2">
         <Button variant="outline" @click="handleDelete" class="text-destructive hover:text-destructive">Delete</Button>
         <Button @click="handleSave">Save Changes</Button>
      </div>

    </SheetContent>
  </Sheet>
</template>
