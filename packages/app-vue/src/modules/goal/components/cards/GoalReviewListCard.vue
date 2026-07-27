<template>
  <Dialog v-model:open="isVisible">
    <DialogContent class="max-h-[90vh] max-w-4xl overflow-hidden p-0">
      <DialogHeader class="border-b px-6 py-4">
        <DialogTitle class="text-lg font-semibold">{{
          t('goal.cards.reviewListCard.title')
        }}</DialogTitle>
        <DialogDescription>
          {{ goal?.name ?? t('goal.cards.reviewListCard.goal') }} · {{ goalReviews.length }}
          {{ t('goal.cards.reviewListCard.count') }}
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
        <div v-if="isLoading" class="space-y-2">
          <Skeleton class="h-16 w-full" />
          <Skeleton class="h-16 w-full" />
        </div>

        <div v-else-if="!hasReviews" class="rounded-md border border-dashed p-8 text-center">
          <p class="text-sm text-muted-foreground">{{ t('goal.cards.reviewListCard.empty') }}</p>
          <Button class="mt-3" size="sm" @click="createNewReview">{{
            t('goal.cards.reviewListCard.createReview')
          }}</Button>
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">
              {{ t('goal.cards.reviewListCard.records') }} ({{ goalReviews.length }})
            </p>
            <Button size="sm" variant="outline" @click="createNewReview">{{
              t('goal.cards.reviewListCard.newReview')
            }}</Button>
          </div>

          <Card v-for="review in goalReviews" :key="String(review.id)" class="border">
            <CardContent class="space-y-3 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-semibold">{{ review.summary }}</p>
                    <Badge variant="outline">{{ getReviewTypeText(review.type) }}</Badge>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ formatReviewedAt(review.reviewedAt) }}
                  </p>
                  <p v-if="review.achievements" class="mt-2 text-sm text-muted-foreground">
                    {{ t('goal.cards.reviewListCard.achievement') }}{{ review.achievements }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <Button size="sm" variant="outline" @click="handleView(review.id)">{{
                    t('goal.cards.reviewListCard.view')
                  }}</Button>
                  <Button size="sm" variant="destructive" @click="handleDelete(review.id)">{{
                    t('goal.cards.reviewListCard.delete')
                  }}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogFooter class="border-t px-6 py-3">
        <Button variant="ghost" @click="handleClose">{{
          t('goal.cards.reviewListCard.close')
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GoalClientDTO, GoalReviewClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { formatProductPattern } from '../../../../shared/utils/product-time';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Skeleton } from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();

const props = defineProps<{
  goal?: GoalClientDTO;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  view: [reviewId: GoalReviewClientDTO['id']];
  delete: [reviewId: GoalReviewClientDTO['id']];
  create: [goalId: GoalClientDTO['id']];
  close: [];
}>();

const isVisible = ref(false);

const openDialog = () => {
  isVisible.value = true;
};

const closeDialog = () => {
  isVisible.value = false;
  emit('close');
};

const openCard = () => {
  openDialog();
};

const closeCard = () => {
  closeDialog();
};

const handleView = (reviewId: GoalReviewClientDTO['id']) => {
  emit('view', reviewId);
  closeDialog();
};

const handleDelete = (reviewId: GoalReviewClientDTO['id']) => {
  emit('delete', reviewId);
};

const handleClose = () => {
  closeDialog();
};

const createNewReview = () => {
  if (!props.goal) return;
  emit('create', props.goal.id);
  closeDialog();
};

const goalReviews = computed(() => props.goal?.reviews ?? []);
const hasReviews = computed(() => goalReviews.value.length > 0);

const getReviewTypeText = (type: GoalReviewClientDTO['type']) => {
  const texts: Record<string, string> = {
    Weekly: t('goal.cards.reviewListCard.typeWeekly'),
    Monthly: t('goal.cards.reviewListCard.typeMonthly'),
    Quarterly: t('goal.cards.reviewListCard.typeQuarterly'),
    Annual: t('goal.cards.reviewListCard.typeYearly'),
    Adhoc: t('goal.cards.reviewListCard.typeAdhoc'),
    Final: t('goal.cards.reviewListCard.typeFinal'),
  };
  return texts[type] ?? String(type);
};

const formatReviewedAt = (value: GoalReviewClientDTO['reviewedAt']) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatProductPattern(date, 'yyyy/MM/dd HH:mm');
};

defineExpose({
  openDialog,
  closeDialog,
  openCard,
  closeCard,
});
</script>
