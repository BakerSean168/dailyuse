<template>
  <Card
    class="group relative overflow-hidden transition-all duration-200 hover:shadow-md border border-border/60 bg-card hover:border-border/80"
  >
    <!-- Status Strip -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200"
      :style="{ backgroundColor: goal.color || 'hsl(var(--primary))' }"
    ></div>

    <CardContent class="p-4 pl-5">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-2">
          <Badge
            variant="outline"
            :class="
              cn(
                'h-5 px-1.5 text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1',
                getStatusColorClass(goal.status),
              )
            "
          >
            <component :is="getStatusIcon(goal.status)" class="h-3 w-3" />
            {{ getStatusLabel(goal.status) }}
          </Badge>
          <span
            v-if="goal.category"
            class="text-xs text-muted-foreground font-medium flex items-center gap-1"
          >
            <Users class="h-3 w-3" /> {{ goal.category }}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem @click="emit('edit', goal)">Edit</DropdownMenuItem>
            <DropdownMenuItem
              @click="emit('delete', goal.id)"
              class="text-destructive focus:text-destructive"
              >Delete</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Title -->
      <h3
        class="font-medium text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
        @click="emit('edit', goal)"
      >
        {{ goal.name }}
      </h3>

      <!-- Progress Bar -->
      <div class="mt-4 mb-2">
        <div class="flex justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span class="font-medium">{{ Math.round(overallProgress) }}%</span>
        </div>
        <Progress
          :model-value="overallProgress"
          class="h-1.5 bg-secondary"
          :indicator-class="getProgressColorClass(goal.status)"
        />
      </div>

      <!-- Footer Info -->
      <div class="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <Target class="h-3.5 w-3.5" />
            <span>{{ completedKRCount }}/{{ totalKRCount }} KRs</span>
          </div>
          <div
            v-if="daysRemaining !== null"
            class="flex items-center gap-1"
            :class="getDaysRemainingClass(daysRemaining)"
          >
            <Clock class="h-3.5 w-3.5" />
            <span>{{ daysRemaining }}d left</span>
          </div>
        </div>

        <div v-if="goal.identityId" class="flex items-center gap-1.5">
          <Avatar class="h-5 w-5 border border-background">
            <AvatarFallback class="text-[9px] bg-primary/10 text-primary">{{
              (goal.name || '').substring(0, 2).toUpperCase()
            }}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div>
        <Progress
          :model-value="goal.overallProgress"
          class="h-1.5 bg-secondary"
          :indicator-class="getProgressColorClass(goal.status)"
        />
      </div>

      <!-- Footer Info -->
      <div class="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <Target class="h-3.5 w-3.5" />
            <span>{{ goal.completedKeyResultCount }}/{{ goal.keyResultCount }} KRs</span>
          </div>
          <div class="flex items-center gap-1" :class="getDaysRemainingClass(goal.daysRemaining)">
            <Clock class="h-3.5 w-3.5" />
            <span>{{ goal.daysRemaining }}d left</span>
          </div>
        </div>

        <div v-if="goal.owner" class="flex items-center gap-1.5">
          <Avatar class="h-5 w-5 border border-background">
            <AvatarFallback class="text-[9px] bg-primary/10 text-primary">{{
              goal.owner.name.substring(0, 2).toUpperCase()
            }}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import { Avatar, AvatarFallback } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@dailyuse/ui-vue-shadcn';
import {
  MoreHorizontal,
  Target,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Archive,
  Users,
} from 'lucide-vue-next';
import { cn } from '@dailyuse/ui-vue-shadcn';

interface Props {
  goal: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'edit', goal: any): void;
  (e: 'delete', id: string): void;
}>();

// ========== Derived fields from GoalClientDTO ==========
const krs = computed(() => props.goal.keyResults ?? []);

const totalKRCount = computed(() => krs.value.length);

const completedKRCount = computed(() => {
  return krs.value.filter((kr: any) => {
    if (!kr.progress) return false;
    return kr.progress.currentValue >= kr.progress.targetValue;
  }).length;
});

const overallProgress = computed(() => {
  if (krs.value.length === 0) return 0;
  const totalWeight = krs.value.reduce((sum: number, kr: any) => sum + (kr.weight ?? 1), 0);
  if (totalWeight === 0) return 0;
  const weightedProgress = krs.value.reduce((sum: number, kr: any) => {
    const p = kr.progress;
    if (!p || !p.targetValue) return sum;
    const pct = Math.min(1, p.currentValue / p.targetValue);
    return sum + pct * (kr.weight ?? 1);
  }, 0);
  return Math.round((weightedProgress / totalWeight) * 100);
});

const daysRemaining = computed<number | null>(() => {
  if (!props.goal.targetDate) return null;
  const diff = props.goal.targetDate - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Helper functions for Linear-like styling
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return CheckCircle;
    case 'Archived':
      return Archive;
    case 'Draft':
      return AlertCircle;
    default:
      return PlayCircle; // Active
  }
};

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    Active: '进行中',
    Completed: '已完成',
    Archived: '已归档',
    Draft: '草稿',
  };
  return map[status] ?? status;
};

const getDaysRemainingClass = (days: number) => {
  if (days < 0) return 'text-destructive font-medium';
  if (days < 7) return 'text-orange-500 font-medium';
  return '';
};

const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30';
    case 'ARCHIVED':
      return 'text-muted-foreground border-muted bg-muted/50';
    case 'DRAFT':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/30';
    default:
      return 'text-primary border-primary/20 bg-primary/5';
  }
};

const getProgressColorClass = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500';
    case 'DRAFT':
      return 'bg-yellow-500';
    default:
      return 'bg-primary';
  }
};
</script>
