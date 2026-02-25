<template>
  <aside
    v-if="visible"
    class="fixed right-0 top-0 h-screen w-96 border-l bg-background shadow-lg flex flex-col z-50"
  >
    <!-- Header -->
    <div class="flex items-center justify-between bg-primary text-primary-foreground p-4">
      <div class="flex items-center gap-2">
        <BellRing class="h-5 w-5" />
        <h2 class="text-lg font-semibold">{{ title }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-primary-foreground hover:bg-primary/90"
          :disabled="isLoading"
          @click="$emit('refresh')"
        >
          <RefreshCw :class="['h-4 w-4', { 'animate-spin': isLoading }]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-primary-foreground hover:bg-primary/90"
          @click="$emit('open-settings')"
        >
          <Settings class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Filters (Collapsible) -->
    <div v-if="showFilters" class="border-b p-4 space-y-3">
      <Select v-model="localFilters.days" @update:model-value="handleFiltersChange">
        <SelectTrigger>
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Today</SelectItem>
          <SelectItem value="3">Next 3 Days</SelectItem>
          <SelectItem value="7">Next Week</SelectItem>
          <SelectItem value="30">Next Month</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="border-b p-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-primary">{{ stats.total }}</div>
          <div class="text-xs text-muted-foreground">Total</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">{{ stats.today }}</div>
          <div class="text-xs text-muted-foreground">Today</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-destructive">{{ stats.overdue }}</div>
          <div class="text-xs text-muted-foreground">Overdue</div>
        </div>
      </div>
    </div>

    <!-- Reminders List -->
    <ScrollArea class="flex-1">
      <!-- Loading -->
      <div v-if="isLoading" class="p-4 space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle class="h-12 w-12 text-destructive mb-2" />
        <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
        <Button variant="outline" size="sm" @click="$emit('refresh')">Retry</Button>
      </div>

      <!-- Empty State -->
      <div v-else-if="groupedReminders.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
        <BellOff class="h-12 w-12 text-muted-foreground mb-2" />
        <p class="text-sm text-muted-foreground">No upcoming reminders</p>
      </div>

      <!-- Grouped Reminders -->
      <div v-else class="divide-y">
        <div v-for="group in groupedReminders" :key="group.date" class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold">{{ group.dateLabel }}</h3>
            <Badge variant="outline" class="text-xs">{{ group.reminders.length }}</Badge>
          </div>
          <div class="space-y-2">
            <Card
              v-for="reminder in group.reminders"
              :key="reminder.id"
              :class="[
                'p-3 cursor-pointer transition-colors hover:bg-accent',
                { 'border-destructive bg-destructive/5': reminder.isOverdue }
              ]"
              @click="$emit('reminder-click', reminder)"
            >
              <div class="flex items-start gap-2">
                <div :class="['w-2 h-2 rounded-full mt-1.5', getPriorityClass(reminder.priority)]" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ reminder.title || reminder.message }}</p>
                  <p v-if="reminder.message" class="text-xs text-muted-foreground truncate mt-0.5">
                    {{ reminder.message }}
                  </p>
                  <div class="flex items-center justify-between mt-2">
                    <Badge
                      :variant="reminder.isOverdue ? 'destructive' : 'secondary'"
                      class="text-xs"
                    >
                      {{ reminder.timeLabel }}
                    </Badge>
                    <div v-if="reminder.tags && reminder.tags.length > 0" class="flex gap-1">
                      <Badge
                        v-for="tag in reminder.tags.slice(0, 2)"
                        :key="tag"
                        variant="outline"
                        class="text-xs"
                      >
                        {{ tag }}
                      </Badge>
                      <Badge v-if="reminder.tags.length > 2" variant="outline" class="text-xs">
                        +{{ reminder.tags.length - 2 }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Footer Actions -->
    <div class="border-t p-3 flex items-center justify-between">
      <Button variant="ghost" size="sm" @click="showFilters = !showFilters">
        <Filter class="h-4 w-4 mr-2" />
        Filters
      </Button>
      <Button variant="ghost" size="sm" @click="$emit('view-all')">
        View All
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BellRing, RefreshCw, Settings, AlertCircle, BellOff, Filter } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Card } from '@dailyuse/ui-vue-shadcn';
import { ScrollArea } from '@dailyuse/ui-vue-shadcn';
import { Skeleton } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';

interface ReminderItem {
  id: string;
  title?: string;
  message: string;
  priority: string;
  nextTriggerAt: number;
  tags?: string[];
  isOverdue?: boolean;
  timeLabel?: string;
}

interface GroupedReminder {
  date: string;
  dateLabel: string;
  reminders: ReminderItem[];
}

interface Stats {
  total: number;
  today: number;
  overdue: number;
}

interface Filters {
  days: string;
  priorities?: string[];
}

interface Props {
  visible?: boolean;
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  groupedReminders?: GroupedReminder[];
  stats?: Stats | null;
  filters?: Filters;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  title: 'Upcoming Reminders',
  isLoading: false,
  error: null,
  groupedReminders: () => [],
  stats: null,
  filters: () => ({ days: '1' }),
});

const emit = defineEmits<{
  'refresh': [];
  'open-settings': [];
  'reminder-click': [reminder: ReminderItem];
  'view-all': [];
  'filters-change': [filters: Filters];
}>();

const showFilters = ref(false);
const localFilters = ref<Filters>({ ...props.filters });

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

const handleFiltersChange = () => {
  emit('filters-change', { ...localFilters.value });
};

const getPriorityClass = (priority: string): string => {
  const classes: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
  };
  return classes[priority] || 'bg-gray-400';
};
</script>
