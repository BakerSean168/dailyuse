<template>
  <Dialog v-model:open="isVisible">
    <DialogContent class="max-h-[90vh] max-w-4xl overflow-hidden p-0">
      <DialogHeader class="border-b px-6 py-4">
        <DialogTitle class="text-lg font-semibold">复盘记录</DialogTitle>
        <DialogDescription>
          {{ goal?.name ?? '目标' }} · {{ goalReviews.length }} 条记录
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
        <div v-if="isLoading" class="space-y-2">
          <Skeleton class="h-16 w-full" />
          <Skeleton class="h-16 w-full" />
        </div>

        <div v-else-if="!hasReviews" class="rounded-md border border-dashed p-8 text-center">
          <p class="text-sm text-muted-foreground">暂无复盘记录</p>
          <Button class="mt-3" size="sm" @click="createNewReview">创建复盘</Button>
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">复盘记录 ({{ goalReviews.length }})</p>
            <Button size="sm" variant="outline" @click="createNewReview">新建复盘</Button>
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
                    成果：{{ review.achievements }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <Button size="sm" variant="outline" @click="handleView(review.id)">查看</Button>
                  <Button size="sm" variant="destructive" @click="handleDelete(review.id)">删除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogFooter class="border-t px-6 py-3">
        <Button variant="ghost" @click="handleClose">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format } from 'date-fns';
import type { GoalClientDTO, GoalReviewClientDTO } from '@dailyuse/contracts/goal';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Skeleton } from '../../../ui/skeleton';

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
    Weekly: '周复盘',
    Monthly: '月复盘',
    Quarterly: '季度复盘',
    Annual: '年度复盘',
    Adhoc: '临时复盘',
    Final: '终结复盘',
  };
  return texts[type] ?? String(type);
};

const formatReviewedAt = (value: GoalReviewClientDTO['reviewedAt']) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, 'yyyy/MM/dd HH:mm');
};

defineExpose({
  openDialog,
  closeDialog,
  openCard,
  closeCard,
});
</script>
