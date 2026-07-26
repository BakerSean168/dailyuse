<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden p-6">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.krDetail.back') }}
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">{{ t('goal.krDetail.title') }}</h2>
    </div>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('goal.krDetail.loading') }}</div>
    </div>

    <ScrollArea v-else-if="keyResult" class="min-h-0 flex-1">
      <div class="mx-auto max-w-3xl space-y-6">
        <!-- 概览卡片 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>{{ keyResult.title }}</CardTitle>
                <CardDescription v-if="keyResult.description">
                  {{ keyResult.description }}
                </CardDescription>
              </div>
              <Badge variant="outline"
                >{{ t('goal.krDetail.weight') }} {{ keyResult.weight }}</Badge
              >
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 进度条 -->
            <div v-if="keyResult.progress" class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ t('goal.krDetail.currentProgress') }}</span>
                <span class="font-medium">
                  {{ keyResult.progress.currentValue ?? 0 }} /
                  {{ keyResult.progress.targetValue ?? 0 }}
                  {{ keyResult.progress.unit ?? '' }}
                </span>
              </div>
              <Progress :model-value="progressPercent" />
              <p class="text-right text-xs text-muted-foreground">{{ progressPercent }}%</p>
            </div>
          </CardContent>
        </Card>

        <!-- 进度记录列表 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2">
                <History class="h-4 w-4" /> {{ t('goal.krDetail.progressRecords') }}
              </CardTitle>
              <Button size="sm" @click="showAddRecord = true">
                <Plus class="mr-1 h-4 w-4" /> {{ t('goal.krDetail.addRecord') }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              v-if="goalRecords.length === 0"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              {{ t('goal.krDetail.noRecords') }}
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="record in sortedRecords"
                :key="record.id"
                class="flex items-start gap-3 rounded-lg border p-3"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                >
                  <TrendingUp class="h-4 w-4 text-primary" />
                </div>
                <div class="flex-1 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">+{{ record.value }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      formatProductDateTime(record.createdAt)
                    }}</span>
                  </div>
                  <p v-if="record.comment" class="text-xs text-muted-foreground">
                    {{ record.comment }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t('goal.krDetail.recordValue') }} {{ record.valueAfter }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>

    <div v-else class="flex flex-1 items-center justify-center text-muted-foreground">
      {{ t('goal.krDetail.notFound') }}
    </div>

    <!-- 添加记录对话框 -->
    <Dialog v-model:open="showAddRecord">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('goal.krDetail.addRecordTitle') }}</DialogTitle>
          <DialogDescription>{{ t('goal.krDetail.addRecordDesc') }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>{{ t('goal.krDetail.incrementValue') }}</Label>
            <div class="relative flex items-center">
              <Input v-model.number="newRecord.value" type="number" placeholder="0" class="pr-16" />
              <Badge v-if="keyResultUnit" variant="secondary" class="absolute right-3 font-medium">
                {{ keyResultUnit }}
              </Badge>
            </div>
          </div>
          <div class="space-y-2">
            <Label>{{ t('goal.krDetail.remarks') }}</Label>
            <Textarea
              v-model="newRecord.comment"
              :placeholder="t('goal.krDetail.remarksPlaceholder')"
              rows="2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddRecord = false">{{
            t('goal.krDetail.cancel')
          }}</Button>
          <Button :disabled="isSaving" @click="handleAddRecord">
            {{ isSaving ? t('goal.krDetail.saving') : t('goal.krDetail.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, Plus, History, TrendingUp } from '@lucide/vue';
import type { KeyResultId } from '@dailyuse/contracts/primitives';
import { formatProductDateTime } from '@/shared/utils/product-time';
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
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const { t } = useI18n();
const goalId = (route.params.goalId as string) || (route.params.id as string);
const krId = ((route.params.krId as string) || (route.params.keyResultId as string)) as KeyResultId;

const {
  keyResults,
  goalRecords,
  isLoading,
  isSaving,
  fetchKeyResults,
  fetchRecords,
  createRecord,
} = useGoal();

const keyResult = computed(() => {
  const list = keyResults.value ?? [];
  return list.find((kr) => kr.id === krId) ?? null;
});

const keyResultUnit = computed(() => keyResult.value?.progress?.unit ?? '');

const progressPercent = computed(() => {
  if (!keyResult.value?.progress) return 0;
  const { initialValue = 0, currentValue = 0, targetValue = 0 } = keyResult.value.progress;
  if (targetValue === initialValue) return 100;
  return Math.min(
    100,
    Math.max(0, Math.round(((currentValue - initialValue) / (targetValue - initialValue)) * 100)),
  );
});

const sortedRecords = computed(() =>
  [...goalRecords.value]
    .filter((r) => r.keyResultId === krId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
);

const showAddRecord = ref(false);
const newRecord = reactive({ value: 0, comment: '' });

async function handleAddRecord() {
  if (!newRecord.value) {
    toast.warning(t('goal.krDetail.fillValue'));
    return;
  }
  const result = await createRecord(goalId, {
    keyResultId: krId,
    value: newRecord.value,
    note: newRecord.comment || undefined,
  });
  if (result) {
    toast.success(t('goal.krDetail.addSuccess'));
    showAddRecord.value = false;
    newRecord.value = 0;
    newRecord.comment = '';
  }
}

onMounted(async () => {
  if (goalId) {
    await Promise.all([fetchKeyResults(goalId), fetchRecords(goalId)]);
  }
});
</script>
