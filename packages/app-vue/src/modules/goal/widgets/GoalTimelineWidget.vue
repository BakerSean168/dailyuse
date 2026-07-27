import { formatProductDateTime } from '../../../shared/utils/product-time';
<script setup lang="ts">
// ===== Lifecycle =====
onMounted(async () => {
  try {
    isLoading.value = true;
    await fetchGoals();
  } catch (error) {
    console.error('[GoalTimelineWidget] Failed to load goals:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Card class="goal-timeline-widget" :class="`widget-size-${size}`">
    <!-- Header -->
    <CardHeader class="flex flex-row items-center justify-between p-4">
      <div class="flex items-center gap-2">
        <TrendingUp class="h-6 w-6 text-purple-500" />
        <CardTitle class="text-lg">{{ t('goal.timeline.widget.title') }}</CardTitle>
      </div>
      <Badge variant="default" class="bg-purple-500 hover:bg-purple-500/80">
        {{ activeGoals.length }}
      </Badge>
    </CardHeader>

    <Separator />

    <!-- Loading State -->
    <CardContent v-if="isLoading" class="flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 class="h-8 w-8 animate-spin text-purple-500" />
      <p class="text-xs text-muted-foreground mt-2">{{ t('goal.timeline.widget.loading') }}</p>
    </CardContent>

    <!-- Empty State -->
    <CardContent
      v-else-if="activeGoals.length === 0"
      class="flex flex-col items-center justify-center min-h-[200px]"
    >
      <FlagOff class="h-16 w-16 text-muted-foreground" />
      <p class="text-sm text-muted-foreground mt-2">{{ t('goal.timeline.widget.empty') }}</p>
    </CardContent>

    <!-- Goal Timeline List -->
    <CardContent v-else class="p-3 goal-list-container">
      <div v-for="goal in activeGoals" :key="goal.id" class="goal-item mb-3 p-3">
        <!-- Goal Header -->
        <div class="flex items-start justify-between mb-2">
          <span class="text-sm font-bold flex-1">{{ goal.name }}</span>
          <Badge :variant="getBadgeVariant(goal)" class="ml-2 shrink-0">
            {{
              goal.isOverdue
                ? `${t('goal.timeline.widget.overdue')} ${Math.abs(goal.remainingDays)}${t('goal.comparison.dayUnit')}`
                : `${t('goal.timeline.widget.remaining')}${goal.remainingDays}${t('goal.comparison.dayUnit')}`
            }}
          </Badge>
        </div>

        <!-- Progress Bar Container -->
        <div class="mb-2 relative">
          <Progress
            :model-value="goal.timeProgress"
            class="h-6 w-full"
            :class="getProgressBgClass(goal)"
          />
          <!-- Custom indicator overlay for colored bar -->
          <div class="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div
              class="h-full transition-all rounded-full"
              :class="getProgressColorClass(goal)"
              :style="{ width: `${goal.timeProgress}%` }"
            />
          </div>
          <!-- Text overlay -->
          <div class="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span class="text-xs font-bold text-white drop-shadow-sm">
              {{ t('goal.timeline.widget.completed') }} {{ Math.round(goal.completionProgress) }}%
            </span>
            <span class="text-xs text-white drop-shadow-sm">
              {{ t('goal.timeline.widget.time') }} {{ Math.round(goal.timeProgress) }}%
            </span>
          </div>
        </div>

        <!-- Dates (Medium/Large only) -->
        <div
          v-if="!isSmallSize"
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <div class="flex items-center gap-1">
            <CalendarDays class="h-3 w-3" />
            {{ formatProductDateTime(goal.startDate) }}
          </div>
          <ArrowRight class="h-3 w-3" />
          <div class="flex items-center gap-1">
            <Flag class="h-3 w-3" />
            {{ formatProductDateTime(goal.targetDate) }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.goal-timeline-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-size-small {
  max-height: 300px;
}

.widget-size-medium {
  max-height: 500px;
}

.widget-size-large {
  max-height: 700px;
}

.goal-list-container {
  flex: 1;
  overflow-y: auto;
}

.goal-item {
  border-radius: 8px;
  transition: all 0.2s;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
}

.goal-item:hover {
  background: hsl(var(--muted) / 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
