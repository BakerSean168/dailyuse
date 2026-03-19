<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden p-6">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.reviewDetail.back') }}
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">{{ t('goal.reviewDetail.title') }}</h2>
      <Badge v-if="review" variant="outline">{{ review.type }}</Badge>
    </div>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('goal.reviewDetail.loading') }}</div>
    </div>

    <ScrollArea v-else-if="review" class="min-h-0 flex-1">
      <div class="mx-auto max-w-3xl space-y-6">
        <!-- 评分概览 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>{{ t('goal.reviewDetail.overallRating') }}</CardTitle>
              <div class="flex items-center gap-2">
                <Star class="h-5 w-5 text-warning" />
                <span class="text-2xl font-bold">{{ review.rating }}</span>
                <span class="text-sm text-muted-foreground">/ 10</span>
              </div>
            </div>
            <CardDescription>
              {{ t('goal.reviewDetail.reviewedAt') }} {{ formatDate(review.reviewedAt) }}
            </CardDescription>
          </CardHeader>
        </Card>

        <!-- 摘要 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileText class="h-4 w-4" /> {{ t('goal.reviewDetail.summary') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ review.summary }}</p>
          </CardContent>
        </Card>

        <!-- 成就 -->
        <Card v-if="review.achievements">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Trophy class="h-4 w-4 text-success" /> {{ t('goal.reviewDetail.achievements') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ review.achievements }}</p>
          </CardContent>
        </Card>

        <!-- 挑战 -->
        <Card v-if="review.challenges">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-warning" />
              {{ t('goal.reviewDetail.challenges') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ review.challenges }}</p>
          </CardContent>
        </Card>

        <!-- 改进方向 -->
        <Card v-if="review.improvements">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Lightbulb class="h-4 w-4 text-info" /> {{ t('goal.reviewDetail.improvements') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ review.improvements }}</p>
          </CardContent>
        </Card>

        <!-- KR 快照 -->
        <Card v-if="review.keyResultSnapshots?.length">
          <CardHeader>
            <CardTitle>{{ t('goal.reviewDetail.krSnapshot') }}</CardTitle>
            <CardDescription>{{ t('goal.reviewDetail.krSnapshotDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="snap in review.keyResultSnapshots"
                :key="snap.keyResultId"
                class="flex items-center gap-4"
              >
                <span class="min-w-[120px] truncate text-sm font-medium">{{ snap.title }}</span>
                <Progress :model-value="snap.progressPercentage" class="flex-1" />
                <span class="text-sm text-muted-foreground">{{ snap.progressPercentage }}%</span>
              </div>
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
import { ArrowLeft, Star, FileText, Trophy, AlertTriangle, Lightbulb } from 'lucide-vue-next';
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
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const { t, locale } = useI18n();
const goalId = (route.params.goalId as string) || (route.params.id as string);
const reviewId = route.params.reviewId as string;

const { goalReviews, isLoading, fetchReviews } = useGoal();

const review = computed(() => goalReviews.value.find((r) => r.id === reviewId) ?? null);

function formatDate(d: string | number | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

onMounted(async () => {
  if (goalId) await fetchReviews(goalId);
});
</script>
