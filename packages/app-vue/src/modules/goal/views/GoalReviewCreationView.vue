<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden p-6">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.reviewCreation.back') }}
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">{{ t('goal.reviewCreation.title') }}</h2>
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <div class="mx-auto max-w-2xl space-y-6">
        <!-- 复盘类型 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.reviewType') }}</Label>
          <Select v-model="form.reviewType">
            <SelectTrigger>
              <SelectValue :placeholder="t('goal.reviewCreation.selectType')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="ReviewType.Weekly">{{
                t('goal.reviewCreation.weekly')
              }}</SelectItem>
              <SelectItem :value="ReviewType.Monthly">{{
                t('goal.reviewCreation.monthly')
              }}</SelectItem>
              <SelectItem :value="ReviewType.Quarterly">{{
                t('goal.reviewCreation.quarterly')
              }}</SelectItem>
              <SelectItem :value="ReviewType.Final">{{
                t('goal.reviewCreation.final')
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 评分 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.overallRating') }} (1-10)</Label>
          <div class="flex items-center gap-2">
            <Input v-model.number="form.rating" type="number" min="1" max="10" class="w-24" />
            <span class="text-sm text-muted-foreground">/ 10</span>
          </div>
        </div>

        <!-- 标题 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.reviewTitle') }}</Label>
          <Input v-model="form.title" :placeholder="t('goal.reviewCreation.reviewTitle') + '...'" />
        </div>

        <!-- 内容 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.reviewContent') }}</Label>
          <Textarea
            v-model="form.content"
            :placeholder="t('goal.reviewCreation.contentPlaceholder')"
            rows="3"
          />
        </div>

        <!-- 成就 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.achievements') }}</Label>
          <Textarea
            v-model="form.achievements"
            :placeholder="t('goal.reviewCreation.achievementsPlaceholder')"
            rows="3"
          />
        </div>

        <!-- 挑战 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.challenges') }}</Label>
          <Textarea
            v-model="form.challenges"
            :placeholder="t('goal.reviewCreation.challengesPlaceholder')"
            rows="3"
          />
        </div>

        <!-- 改进方向 -->
        <div class="space-y-2">
          <Label>{{ t('goal.reviewCreation.improvements') }}</Label>
          <Textarea
            v-model="form.nextActions"
            :placeholder="t('goal.reviewCreation.improvementsPlaceholder')"
            rows="3"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" @click="$router.back()">{{
            t('goal.reviewCreation.cancel')
          }}</Button>
          <Button :disabled="isSaving" @click="handleSubmit">
            {{ isSaving ? t('goal.reviewCreation.saving') : t('goal.reviewCreation.create') }}
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from 'lucide-vue-next';
import {
  Button,
  Input,
  Label,
  Textarea,
  ScrollArea,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@dailyuse/ui-vue-shadcn';
import { GoalId, ReviewType } from '@dailyuse/goal/domain-shared';
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const goalId = GoalId.of((route.params.goalId as string) || (route.params.id as string));

const { createReview, isSaving } = useGoal();

const form = reactive({
  reviewType: ReviewType.Weekly,
  rating: 7,
  title: '',
  content: '',
  achievements: '',
  challenges: '',
  nextActions: '',
});

async function handleSubmit() {
  if (!form.content) {
    toast.warning(t('goal.reviewCreation.fillContent'));
    return;
  }
  const result = await createReview(goalId, {
    goalId,
    reviewType: form.reviewType,
    rating: form.rating,
    title: form.title || `${form.reviewType} ${t('goal.reviewCreation.reviewTypeSuffix')}`,
    content: form.content,
    achievements: form.achievements,
    challenges: form.challenges,
    nextActions: form.nextActions,
  });
  if (result) {
    toast.success(t('goal.reviewCreation.createSuccess'));
    router.back();
  }
}
</script>
