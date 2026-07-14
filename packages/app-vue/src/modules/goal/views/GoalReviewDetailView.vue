<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden p-6">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.reviewDetail.back') }}
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">{{ t('goal.reviewDetail.title') }}</h2>
      <Badge v-if="review" variant="outline">{{ reviewTypeLabel }}</Badge>
    </div>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('goal.reviewDetail.loading') }}</div>
    </div>

    <ScrollArea v-else-if="review" class="min-h-0 flex-1">
      <div class="mx-auto max-w-6xl space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader class="pb-3">
              <CardDescription>{{ t('goal.reviewDetail.overallRating') }}</CardDescription>
              <div class="flex items-center gap-2">
                <Star class="h-5 w-5 text-warning" />
                <span class="text-3xl font-bold">{{ review.rating }}</span>
                <span class="text-sm text-muted-foreground">/ 5</span>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader class="pb-3">
              <CardDescription>{{ t('goal.reviewDetail.recordsBeforeReview') }}</CardDescription>
              <CardTitle class="text-3xl">{{ reviewRecords.length }}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader class="pb-3">
              <CardDescription>{{ t('goal.reviewDetail.snapshotProgress') }}</CardDescription>
              <CardTitle class="text-3xl">{{ snapshotAverageProgress.toFixed(1) }}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.reviewDetail.summary') }}</CardTitle>
            <CardDescription>
              {{ t('goal.reviewDetail.reviewedAt') }} {{ formatDateTime(review.reviewedAt) }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ review.summary }}</p>
            <div class="grid gap-4 md:grid-cols-3">
              <div v-if="review.achievements" class="rounded-xl border bg-success/5 p-4">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Trophy class="h-4 w-4 text-success" />
                  {{ t('goal.reviewDetail.achievements') }}
                </div>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {{ review.achievements }}
                </p>
              </div>
              <div v-if="review.challenges" class="rounded-xl border bg-warning/5 p-4">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle class="h-4 w-4 text-warning" />
                  {{ t('goal.reviewDetail.challenges') }}
                </div>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {{ review.challenges }}
                </p>
              </div>
              <div v-if="review.improvements" class="rounded-xl border bg-primary/5 p-4">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Lightbulb class="h-4 w-4 text-primary" />
                  {{ t('goal.reviewDetail.improvements') }}
                </div>
                <p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {{ review.improvements }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReviewProgressChart v-if="goal" :review="review" :goal="goal" />

        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.reviewDetail.recordsTimeline') }}</CardTitle>
            <CardDescription>{{ t('goal.reviewDetail.recordsTimelineDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="recordTimelineSeries.length === 0" class="py-10 text-center text-sm text-muted-foreground">
              {{ t('goal.reviewDetail.noTimelineData') }}
            </div>
            <VChart v-else class="h-[340px] w-full" :option="recordTimelineOption" autoresize />
          </CardContent>
        </Card>

        <Card v-if="review.keyResultSnapshots?.length">
          <CardHeader>
            <CardTitle>{{ t('goal.reviewDetail.krSnapshot') }}</CardTitle>
            <CardDescription>{{ t('goal.reviewDetail.krSnapshotDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                  <tr class="border-b">
                    <th class="pb-3 font-medium">{{ t('goal.reviewDetail.krName') }}</th>
                    <th class="pb-3 font-medium">{{ t('goal.reviewDetail.reviewProgressColumn') }}</th>
                    <th class="pb-3 font-medium">{{ t('goal.reviewDetail.currentValueColumn') }}</th>
                    <th class="pb-3 font-medium">{{ t('goal.reviewDetail.targetValueColumn') }}</th>
                    <th class="pb-3 font-medium">{{ t('goal.reviewDetail.recordCountColumn') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in snapshotRows" :key="row.keyResultId" class="border-b last:border-0">
                    <td class="py-3 font-medium">{{ row.title }}</td>
                    <td class="py-3">
                      <div class="flex items-center gap-3">
                        <Progress :model-value="row.progressPercentage" class="h-2 min-w-32 flex-1" />
                        <span class="w-14 text-right text-muted-foreground">
                          {{ row.progressPercentage.toFixed(1) }}%
                        </span>
                      </div>
                    </td>
                    <td class="py-3 text-muted-foreground">{{ row.currentValue }}</td>
                    <td class="py-3 text-muted-foreground">{{ row.targetValue }}</td>
                    <td class="py-3 text-muted-foreground">{{ row.recordCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>

    <div v-else class="flex flex-1 items-center justify-center text-muted-foreground">
      {{ t('goal.reviewDetail.notFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ArrowLeft, Star, Trophy, AlertTriangle, Lightbulb } from '@lucide/vue';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
  Separator,
  Progress,
} from '@dailyuse/ui-vue-shadcn';
import ReviewProgressChart from '../components/echarts/ReviewProgressChart.vue';
import { useGoal } from '../composables/useGoal';

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const route = useRoute();
const { t, locale } = useI18n();
const goalId = (route.params.goalId as string) || (route.params.id as string);
const reviewId = route.params.reviewId as string;

const { currentGoal: goal, goalRecords, goalReviews, isLoading, getGoalAggregateView } = useGoal();

const review = computed(() => goalReviews.value.find((r) => r.id === reviewId) ?? null);
const reviewTypeLabel = computed(() => {
  if (!review.value) return '';
  const labels: Record<string, string> = {
    Weekly: t('goal.reviewCreation.weekly'),
    Monthly: t('goal.reviewCreation.monthly'),
    Quarterly: t('goal.reviewCreation.quarterly'),
    Final: t('goal.reviewCreation.final'),
  };
  return labels[review.value.type] ?? review.value.type;
});
const reviewRecords = computed(() =>
  goalRecords.value
    .filter((record) => !review.value || record.createdAt <= review.value.reviewedAt)
    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt)),
);
const recordCountByKeyResultId = computed(() => {
  const map = new Map<string, number>();
  for (const record of reviewRecords.value) {
    const key = String(record.keyResultId);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
});
const snapshotRows = computed(() =>
  (review.value?.keyResultSnapshots ?? []).map((snapshot) => ({
    ...snapshot,
    recordCount: recordCountByKeyResultId.value.get(String(snapshot.keyResultId)) ?? 0,
  })),
);
const snapshotAverageProgress = computed(() => {
  const snapshots = review.value?.keyResultSnapshots ?? [];
  if (snapshots.length === 0) return 0;
  return (
    snapshots.reduce((sum, snapshot) => sum + (snapshot.progressPercentage ?? 0), 0) / snapshots.length
  );
});
const recordTimelineSeries = computed(() =>
  (review.value?.keyResultSnapshots ?? [])
    .map((snapshot) => {
      const seriesData = reviewRecords.value
        .filter((record) => record.keyResultId === snapshot.keyResultId)
        .map((record) => [record.createdAt, record.valueAfter]);

      return {
        name: snapshot.title,
        type: 'line',
        smooth: true,
        showSymbol: seriesData.length <= 8,
        data: seriesData,
      };
    })
    .filter((series) => series.data.length > 0),
);
const recordTimelineOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    top: 0,
  },
  grid: {
    left: 24,
    right: 24,
    top: 48,
    bottom: 24,
    containLabel: true,
  },
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: (value: number) =>
        new Date(value).toLocaleDateString(locale.value, {
          month: 'short',
          day: 'numeric',
        }),
    },
  },
  yAxis: {
    type: 'value',
    name: t('goal.reviewDetail.currentValueColumn'),
  },
  series: recordTimelineSeries.value,
}));

function formatDateTime(d: string | number | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  if (goalId) await getGoalAggregateView(goalId);
});
</script>
