<template>
  <ActionableWrapper
    :actions="menuActions"
    :more-button-test-id="`goal-card-menu-trigger-${goal.id}`"
  >
    <Card
      class="group relative overflow-hidden transition-all duration-200 hover:shadow-md border border-border/60 bg-card hover:border-border/80"
      data-testid="goal-card"
      :data-goal-id="goal.id"
      :data-goal-name="goal.name"
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
          data-testid="goal-card-title"
          @click="emit('view', goal)"
        >
          {{ goal.name }}
        </h3>

        <!-- Description -->
        <p class="text-xs text-muted-foreground leading-relaxed min-h-[2rem] line-clamp-2 mb-1">
          {{ goal.description || '' }}
        </p>

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
import { getCompletedKeyResultCount } from '../../utils/progress';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

const props = defineProps<{
  goal: GoalClientDTO;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  view: [goal: GoalClientDTO];
  edit: [goal: GoalClientDTO];
  delete: [id: string];
}>();

// ========== Menu Actions ==========
const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'edit',
    testId: `goal-card-edit-action-${props.goal.id}`,
    label: menuLabel('edit'),
    icon: Pencil,
    handler: () => emit('edit', props.goal),
  },
  {
    key: 'delete',
    testId: `goal-card-delete-action-${props.goal.id}`,
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
  return getCompletedKeyResultCount(props.goal);
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
  if (days < 7) return 'text-warning font-medium';
  return '';
};

const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'text-success border-success/40 bg-success/10 dark:bg-success/20 dark:border-success/40';
    case 'Archived':
      return 'text-muted-foreground border-muted bg-muted/50';
    case 'Draft':
      return 'text-warning border-warning/40 bg-warning/10 dark:bg-warning/20 dark:border-yellow-900/30';
    default:
      return 'text-primary border-primary/20 bg-primary/5';
  }
};

</script>
