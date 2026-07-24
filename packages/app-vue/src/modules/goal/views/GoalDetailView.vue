<template>
  <div class="h-full" data-testid="goal-detail">
    <!-- 目标不存在 = 整页空态 + 返回（§4-7） -->
    <AppEmptyState
      v-if="!goal && !isInitialLoading"
      :icon="Target"
      :title="t('goal.detail.notFound')"
      :action-label="t('goal.detail.backToList')"
      testid="goal-detail-not-found"
      @action="router.push({ name: 'goal-list' })"
    />

    <DetailPageShell
      v-else
      :title="goal?.name || t('goal.detail.title')"
      back-to="/goals"
      title-testid="goal-detail-title"
    >
      <template #badges>
        <template v-if="goal">
          <Badge :variant="goal.status === 'Active' ? 'default' : 'secondary'">
            {{ getStatusLabel(goal.status) }}
          </Badge>
          <Badge variant="outline">{{ getImportanceLabel(goal.importance) }}</Badge>
        </template>
      </template>

      <template #actions>
        <!-- 主操作：记录进度（选择 KR → GoalRecordDialog；无 KR 禁用并提示原因，§4-7） -->
        <DropdownMenu v-if="keyResults.length > 0">
          <DropdownMenuTrigger as-child>
            <Button size="sm" class="h-8" data-testid="goal-record-progress-button">
              <Plus class="mr-1.5 h-4 w-4" />
              {{ t('goal.detail.recordProgress') }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem
              v-for="kr in keyResults"
              :key="kr.id"
              class="text-xs"
              @click="openRecordDialog(kr.id)"
            >
              {{ kr.title }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip v-else>
          <TooltipTrigger as-child>
            <span>
              <Button size="sm" class="h-8" disabled data-testid="goal-record-progress-button">
                <Plus class="mr-1.5 h-4 w-4" />
                {{ t('goal.detail.recordProgress') }}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent class="text-xs">
            {{ t('goal.detail.recordNeedsKr') }}
          </TooltipContent>
        </Tooltip>

        <!-- 次操作 ⋯：编辑 + 危险区删除（§0.1） -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :aria-label="t('common.more')"
              data-testid="goal-detail-more"
            >
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuItem @click="handleEditGoal">
              <Pencil class="mr-2 h-4 w-4" />
              {{ t('common.edit') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="handleDeleteGoal"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              {{ t('common.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <!-- 单行元数据：起止 · 分类 · #标签（四宫格压缩，§4-5） -->
      <template v-if="goal" #meta>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            {{ formatDate(goal.startDate) }} ~ {{ formatDate(goal.targetDate) }}
          </span>
          <span>·</span>
          <span>{{ goal.category || t('goal.detail.uncategorized') }}</span>
          <template v-if="goal.tags?.length">
            <span>·</span>
            <span v-for="tag in goal.tags" :key="tag" class="text-info">#{{ tag }}</span>
          </template>
        </div>
      </template>

      <!-- 加载 = 详情骨架（§4-7） -->
      <div v-if="isInitialLoading" class="space-y-4" data-testid="goal-detail-skeleton">
        <Skeleton class="h-16 w-full rounded-lg" />
        <Skeleton class="h-24 w-full rounded-lg" />
        <Skeleton class="h-24 w-full rounded-lg" />
      </div>

      <div v-else-if="goal" class="space-y-6">
        <!-- 概览行：小进度环 + KR 完成数 + 描述摘要（大环缩小，§4-5） -->
        <div class="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-3">
          <div class="relative hidden h-14 w-14 shrink-0 items-center justify-center md:flex">
            <svg class="h-14 w-14 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--muted))" stroke-width="12" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                :stroke="goalAccentColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringDashOffset"
              />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-foreground">
              {{ goalProgress }}% ·
              {{ t('goal.detail.krCompleted', { done: completedKeyResultCount, total: totalKeyResultCount }) }}
            </p>
            <p v-if="goal.description" class="mt-0.5 truncate text-xs text-muted-foreground">
              {{ goal.description }}
            </p>
          </div>
        </div>

        <!-- 关键结果（本页正文，§4-4） -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">{{ t('goal.detail.keyResults') }}</CardTitle>
              <Button v-if="keyResults.length > 0" size="sm" variant="outline" @click="handleOpenAddKR">
                <Plus class="mr-1 h-4 w-4" /> {{ t('goal.detail.addKR') }}
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="kr in keyResults"
              :key="kr.id"
              class="cursor-pointer rounded-lg border p-4 hover:bg-accent/50"
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

            <!-- 无 KR：区块空态升级为页面主引导（§4-7） -->
            <AppEmptyState
              v-if="keyResults.length === 0"
              :title="t('goal.detail.noKrTitle')"
              :description="t('goal.detail.noKrDescription')"
              :action-label="t('goal.detail.addKR')"
              testid="goal-kr-empty-state"
              @action="handleOpenAddKR"
            />
          </CardContent>
        </Card>

        <!-- 记录 / 复盘 双 Tab（保留） -->
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
                    formatDate(record.createdAt)
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
                  <p class="font-medium">{{ formatDateTime(record.createdAt) }}</p>
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
            <!-- 创建复盘：从页头移到复盘 Tab 内首位（§4-5） -->
            <Button
              size="sm"
              variant="outline"
              data-testid="goal-create-review-button"
              @click="handleCreateReview"
            >
              <Plus class="mr-1 h-4 w-4" /> {{ t('goal.reviewCreation.create') }}
            </Button>

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
                  formatDate(review.reviewedAt)
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
    </DetailPageShell>

    <KeyResultDialog ref="keyResultDialogRef" @save="handleSaveKR" />
    <GoalRecordDialog ref="recordDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useConfirm,
} from '@dailyuse/ui-vue-shadcn';
import DetailPageShell from '../../../components/shared/DetailPageShell.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useGoal } from '../composables/useGoal';
import KeyResultDialog from '../components/dialogs/KeyResultDialog.vue';
import GoalRecordDialog from '../components/dialogs/GoalRecordDialog.vue';
import { getCompletedKeyResultCount, getGoalOverallProgress } from '../utils/progress';
import type { KeyResultClientDTO } from '@dailyuse/contracts/goal';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
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
  deleteGoal,
} = useGoal();

const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);
const recordDialogRef = ref<InstanceType<typeof GoalRecordDialog> | null>(null);
const expandedRecordId = ref<string | null>(null);
const isInitialLoading = ref(true);
const ringRadius = 48;
const ringCircumference = 2 * Math.PI * ringRadius;

const goalProgress = computed(() => getGoalOverallProgress(goal.value));
const totalKeyResultCount = computed(
  () => goal.value?.totalKeyResults ?? goal.value?.keyResults?.length ?? keyResults.value.length,
);
const completedKeyResultCount = computed(() => getCompletedKeyResultCount(goal.value));
const goalAccentColor = computed(() => goal.value?.color || 'hsl(var(--primary))');
const ringDashOffset = computed(
  () => ringCircumference * (1 - Math.min(100, Math.max(0, goalProgress.value)) / 100),
);

function formatDate(value: number | null | undefined): string {
  return value
    ? new Date(value).toLocaleDateString(locale.value)
    : t('goal.detail.notSet');
}

/** Soft residual 1204: component-local formatDateTime (locale default); ≠ app-react Intl zh-CN sole. */
function formatDateTime(value: number): string {
  return new Date(value).toLocaleString(locale.value);
}

function openRecordDialog(keyResultId: string) {
  recordDialogRef.value?.openDialog(goalId, keyResultId);
}

function handleOpenAddKR() {
  keyResultDialogRef.value?.openForCreateKeyResult(goalId);
}

function handleCreateReview() {
  router.push(`/goals/${goalId}/review/create`);
}

function handleEditGoal() {
  router.push({ name: 'goal-list', query: { dialog: 'goal', goalId } });
}

async function handleDeleteGoal() {
  const confirmed = await useConfirm({
    title: t('goal.list.confirmDeleteTitle'),
    description: t('goal.list.confirmDelete'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (!confirmed) return;
  const ok = await deleteGoal(goalId);
  if (ok) {
    router.push({ name: 'goal-list' });
  }
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
    startValue: kr.progress.initialValue,
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
  const krs = keyResults.value ?? [];
  const kr = krs.find((k) => k.id === keyResultId);
  return kr?.title ?? keyResultId;
}

function calculateKRProgress(kr: KeyResultClientDTO): number {
  const current = kr.progress?.currentValue || 0;
  const target = kr.progress?.targetValue || 100;
  const initial = kr.progress?.initialValue || 0;
  if (target === initial) return 100;
  return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Active: t('goal.cards.goalStatus.active'),
    Completed: t('goal.cards.goalStatus.completed'),
    Archived: t('goal.cards.goalStatus.archived'),
    Draft: t('goal.cards.goalStatus.draft'),
  };
  return labels[status] ?? status;
}

/**
 * Residual 1219 keep-boundary: app-vue goal getImportanceLabel — Vital-scale i18n map.
 * Goal domain importance enum → t('goal.dialog.importance*'); not English identity.
 * Soft residual 1219: app-react English literals + KRPreviewList high/medium/low differ (no force-merge).
 */
function getImportanceLabel(importance: string): string {
  const labels: Record<string, string> = {
    Vital: t('goal.dialog.importanceVital'),
    Important: t('goal.dialog.importanceImportant'),
    Moderate: t('goal.dialog.importanceModerate'),
    Minor: t('goal.dialog.importanceMinor'),
    Trivial: t('goal.dialog.importanceTrivial'),
  };
  return labels[importance] ?? importance;
}

onMounted(async () => {
  try {
    await fetchGoal(goalId);
    await Promise.all([fetchKeyResults(goalId), fetchRecords(goalId), fetchReviews(goalId)]);
  } finally {
    isInitialLoading.value = false;
  }
});
</script>
