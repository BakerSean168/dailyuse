<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-3 border-b px-6 py-4">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.detail.back') }}
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">{{ goal?.name || t('goal.detail.title') }}</h2>
    </div>

    <ScrollArea v-if="goal" class="flex-1">
      <div class="mx-auto max-w-4xl space-y-6 p-6">
        <!-- 目标概览 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>{{ goal.name }}</CardTitle>
                <CardDescription>{{
                  goal.description || t('goal.detail.noDescription')
                }}</CardDescription>
              </div>
              <div class="flex gap-2">
                <Badge :variant="goal.status === 'Active' ? 'default' : 'secondary'">{{
                  goal.status
                }}</Badge>
                <Badge variant="outline">{{ goal.importance }}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">{{ t('goal.detail.startDate') }}</span>
                <p class="font-medium">
                  {{
                    goal.startDate
                      ? new Date(goal.startDate).toLocaleDateString()
                      : t('goal.detail.notSet')
                  }}
                </p>
              </div>
              <div>
                <span class="text-muted-foreground">{{ t('goal.detail.targetDate') }}</span>
                <p class="font-medium">
                  {{
                    goal.targetDate
                      ? new Date(goal.targetDate).toLocaleDateString()
                      : t('goal.detail.notSet')
                  }}
                </p>
              </div>
              <div>
                <span class="text-muted-foreground">{{ t('goal.detail.category') }}</span>
                <p class="font-medium">{{ goal.category || t('goal.detail.uncategorized') }}</p>
              </div>
            </div>
            <div v-if="goal.tags?.length" class="mt-4 flex flex-wrap gap-1">
              <Badge v-for="tag in goal.tags" :key="tag" variant="outline" class="text-xs">
                {{ tag }}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- 关键结果 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">{{ t('goal.detail.keyResults') }}</CardTitle>
              <Button size="sm" @click="handleOpenAddKR">
                <Plus class="mr-1 h-4 w-4" /> {{ t('goal.detail.addKR') }}
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="kr in keyResults"
              :key="kr.id"
              class="rounded-lg border p-4 hover:bg-accent/50"
              @click="$router.push(`/goals/${goalId}/key-results/${kr.id}`)"
            >
              <div class="mb-2 flex items-center justify-between">
                <p class="font-medium">{{ kr.title }}</p>
                <span class="text-sm text-muted-foreground">
                  {{ kr.progress?.currentValue || 0 }} / {{ kr.progress?.targetValue || 100 }}
                </span>
              </div>
              <Progress :model-value="calculateKRProgress(kr)" class="h-2" />
            </div>

            <p
              v-if="keyResults.length === 0"
              class="py-4 text-center text-sm text-muted-foreground"
            >
              {{ t('goal.detail.noKR') }}
            </p>
          </CardContent>
        </Card>

        <!-- 标签页 -->
        <Tabs default-value="records">
          <TabsList>
            <TabsTrigger value="records">{{ t('goal.detail.progressRecords') }}</TabsTrigger>
            <TabsTrigger value="reviews">{{ t('goal.detail.review') }}</TabsTrigger>
          </TabsList>

          <TabsContent value="records" class="mt-4 space-y-2">
            <div
              v-for="record in goalRecords"
              :key="record.id"
              class="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent/50"
              @click="toggleRecordDetail(record.id)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">
                    {{ t('goal.detail.recordValue') }} {{ record.value }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ record.comment || t('goal.detail.noRemarks') }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">{{
                    new Date(record.createdAt).toLocaleDateString()
                  }}</span>
                  <component
                    :is="expandedRecordId === record.id ? ChevronUp : ChevronDown"
                    class="h-4 w-4 text-muted-foreground"
                  />
                </div>
              </div>
              <div
                v-if="expandedRecordId === record.id"
                class="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-sm"
              >
                <div>
                  <span class="text-muted-foreground">{{ t('goal.detail.recordIncrement') }}</span>
                  <p class="font-medium">{{ record.value }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ t('goal.detail.recordValueAfter') }}</span>
                  <p class="font-medium">{{ record.valueAfter }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ t('goal.detail.recordKeyResult') }}</span>
                  <p class="font-medium">{{ getKeyResultTitle(record.keyResultId) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ t('goal.detail.recordTime') }}</span>
                  <p class="font-medium">{{ new Date(record.createdAt).toLocaleString() }}</p>
                </div>
              </div>
            </div>
            <p
              v-if="goalRecords.length === 0"
              class="py-4 text-center text-sm text-muted-foreground"
            >
              {{ t('goal.detail.noRecords') }}
            </p>
          </TabsContent>

          <TabsContent value="reviews" class="mt-4 space-y-2">
            <Card
              v-for="review in goalReviews"
              :key="review.id"
              class="cursor-pointer hover:bg-accent/50"
              @click="$router.push(`/goals/${goalId}/review/${review.id}`)"
            >
              <CardContent class="flex items-center justify-between p-4">
                <div>
                  <p class="font-medium">{{ review.type }} {{ t('goal.detail.reviewSuffix') }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ review.summary || t('goal.detail.noSummary') }}
                  </p>
                </div>
                <span class="text-xs text-muted-foreground">{{
                  new Date(review.reviewedAt).toLocaleDateString()
                }}</span>
              </CardContent>
            </Card>
            <p
              v-if="goalReviews.length === 0"
              class="py-4 text-center text-sm text-muted-foreground"
            >
              {{ t('goal.detail.noReviews') }}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>

    <div v-else class="flex flex-1 items-center justify-center">
      <p class="text-muted-foreground">{{ t('goal.detail.loading') }}</p>
    </div>

    <KeyResultDialog ref="keyResultDialogRef" @save="handleSaveKR" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, Plus, ChevronDown, ChevronUp } from 'lucide-vue-next';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Progress,
  ScrollArea,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@dailyuse/ui-vue-shadcn';
import { useGoal } from '../composables/useGoal';
import KeyResultDialog from '../components/dialogs/KeyResultDialog.vue';

const route = useRoute();
const { t } = useI18n();
const goalId = route.params.id as string;

const {
  currentGoal: goal,
  keyResults,
  goalRecords,
  goalReviews,
  fetchGoal,
  fetchKeyResults,
  fetchRecords,
  fetchReviews,
  addKeyResult,
} = useGoal();

const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);
const expandedRecordId = ref<string | null>(null);

function handleOpenAddKR() {
  keyResultDialogRef.value?.openForCreateKeyResult(goalId);
}

async function handleSaveKR(payload: {
  goalId: string | null;
  keyResult: {
    title: string;
    description: string | null;
    weight: number;
    order: number;
    progress: {
      valueType: string;
      aggregationMethod: string;
      initialValue: number;
      targetValue: number;
      currentValue: number;
      unit: string | null;
    };
  };
  isEditing: boolean;
  isInGoalEditing: boolean;
}) {
  if (!payload.goalId) return;
  const kr = payload.keyResult;
  await addKeyResult(payload.goalId, {
    goalId: payload.goalId,
    title: kr.title,
    description: kr.description ?? undefined,
    valueType: kr.progress.valueType,
    calculationMethod: kr.progress.aggregationMethod,
    targetValue: kr.progress.targetValue,
    currentValue: kr.progress.currentValue,
    unit: kr.progress.unit ?? undefined,
    weight: kr.weight,
  } as Parameters<typeof addKeyResult>[1]);
  await fetchKeyResults(payload.goalId);
}

function toggleRecordDetail(recordId: string) {
  expandedRecordId.value = expandedRecordId.value === recordId ? null : recordId;
}

function getKeyResultTitle(keyResultId: string): string {
  const kr = keyResults.value.find((k) => k.id === keyResultId);
  return kr?.title ?? keyResultId;
}

function calculateKRProgress(kr: any): number {
  const current = kr.progress?.currentValue || 0;
  const target = kr.progress?.targetValue || 100;
  const initial = kr.progress?.initialValue || 0;
  if (target === initial) return 100;
  return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
}

onMounted(async () => {
  await fetchGoal(goalId);
  await Promise.all([fetchKeyResults(goalId), fetchRecords(goalId), fetchReviews(goalId)]);
});
</script>
