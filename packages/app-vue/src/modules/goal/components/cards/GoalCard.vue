<template>
  <ActionableWrapper :actions="menuActions">
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
        </div>

        <!-- Title -->
        <h3
          class="font-medium text-sm leading-snug mb-1 min-h-[2.5rem] line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
          @click="emit('view', goal)"
        >
          {{ goal.name }}
        </h3>

        <!-- Description -->
        <p class="text-xs text-muted-foreground leading-relaxed min-h-[2rem] line-clamp-2 mb-1">
          {{ goal.description || '' }}
        </p>

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
      </CardContent>
    </Card>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import { Avatar, AvatarFallback } from '@dailyuse/ui-vue-shadcn';
import {
  Target,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Archive,
  Users,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { cn } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../../components/shared';
import type { MenuAction } from '../../../../components/shared';

const props = defineProps<{
  goal: any;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  view: [goal: any];
  edit: [goal: any];
  delete: [id: string];
}>();

// ========== Menu Actions ==========
const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'edit',
    label: menuLabel('edit'),
    icon: Pencil,
    handler: () => emit('edit', props.goal),
  },
  {
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => emit('delete', props.goal.id),
  },
]);

// ========== Derived fields from GoalClientDTO ==========
const krs = computed(() => props.goal.keyResults ?? []);

const totalKRCount = computed(() => props.goal.totalKeyResults ?? krs.value.length);

const completedKRCount = computed(() => {
  if (typeof props.goal.completedKeyResults === 'number') {
    return props.goal.completedKeyResults;
  }
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
    Active: t('goal.cards.goalStatus.active'),
    Completed: t('goal.cards.goalStatus.completed'),
    Archived: t('goal.cards.goalStatus.archived'),
    Draft: t('goal.cards.goalStatus.draft'),
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
    case 'Completed':
      return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30';
    case 'Archived':
      return 'text-muted-foreground border-muted bg-muted/50';
    case 'Draft':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/30';
    default:
      return 'text-primary border-primary/20 bg-primary/5';
  }
};

const getProgressColorClass = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-500';
    case 'Draft':
      return 'bg-yellow-500';
    default:
      return 'bg-primary';
  }
};
</script>
