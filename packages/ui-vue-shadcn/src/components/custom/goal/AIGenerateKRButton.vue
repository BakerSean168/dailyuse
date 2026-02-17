<template>
  <div>
    <Button
      :disabled="!hasQuota || isGenerating"
      @click="openDialog"
      data-testid="ai-generate-kr-button"
    >
      <Sparkles class="mr-2 h-4 w-4" />
      <span>AI 生成关键结果</span>
      <Badge v-if="quota" :variant="hasQuota ? 'default' : 'destructive'" class="ml-2">
        {{ quota.remainingQuota }}/{{ quota.quotaLimit }}
      </Badge>
    </Button>

    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Sparkles class="h-5 w-5" />
            AI 智能生成关键结果
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <Alert v-if="quota" :variant="hasQuota ? 'default' : 'destructive'">
            <Info class="h-4 w-4" />
            <AlertTitle>今日剩余额度</AlertTitle>
            <AlertDescription>
              {{ quota.remainingQuota }} / {{ quota.quotaLimit }} 次
              <span v-if="timeToReset" class="ml-2 text-xs">({{ timeToReset }}后重置)</span>
            </AlertDescription>
          </Alert>

          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="goalTitle">目标标题 *</Label>
              <Input
                id="goalTitle"
                v-model="formData.goalTitle"
                placeholder="例如：提升团队工作效率"
                :disabled="isGenerating"
                data-testid="goal-title-input"
              />
            </div>

            <div class="space-y-2">
              <Label for="goalDescription">目标描述（可选）</Label>
              <Textarea
                id="goalDescription"
                v-model="formData.goalDescription"
                placeholder="详细描述目标的背景、意义和期望结果..."
                rows="3"
                :disabled="isGenerating"
                data-testid="goal-description-input"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="startDate">开始日期 *</Label>
                <Input
                  id="startDate"
                  v-model="formData.startDate"
                  type="date"
                  :disabled="isGenerating"
                  data-testid="start-date-input"
                />
              </div>

              <div class="space-y-2">
                <Label for="endDate">结束日期 *</Label>
                <Input
                  id="endDate"
                  v-model="formData.endDate"
                  type="date"
                  :disabled="isGenerating"
                  data-testid="end-date-input"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="goalContext">额外上下文（可选）</Label>
              <Textarea
                id="goalContext"
                v-model="formData.goalContext"
                placeholder="提供额外的目标背景信息，帮助AI更好地生成关键结果..."
                rows="2"
                :disabled="isGenerating"
                data-testid="goal-context-input"
              />
            </div>

            <Alert v-if="error" variant="destructive" data-testid="error-alert">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeDialog" :disabled="isGenerating" data-testid="cancel-button">
            取消
          </Button>
          <Button
            :disabled="!formValid || !hasQuota || isGenerating"
            @click="handleGenerate"
            data-testid="generate-button"
          >
            <Sparkles class="mr-2 h-4 w-4" />
            {{ isGenerating ? '生成中...' : '生成关键结果' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription
} from '@dailyuse/ui-vue-shadcn';
import { Sparkles, Info, AlertCircle } from 'lucide-vue-next';

interface Props {
  initialGoalTitle?: string;
  initialGoalDescription?: string;
  initialStartDate?: number;
  initialEndDate?: number;
  isGenerating?: boolean;
  error?: string | null;
  quota?: { remainingQuota: number; quotaLimit: number } | null;
  hasQuota?: boolean;
  timeToReset?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  isGenerating: false,
  hasQuota: true,
});

const emit = defineEmits<{
  generated: [result: any];
  error: [error: string];
  generate: [data: any];
  loadQuota: [];
  clearError: [];
}>();

const showDialog = ref(false);
const formData = ref({
  goalTitle: '',
  goalDescription: '',
  startDate: '',
  endDate: '',
  goalContext: '',
});

const formValid = computed(() => {
  return !!(
    formData.value.goalTitle &&
    formData.value.startDate &&
    formData.value.endDate &&
    new Date(formData.value.endDate) >= new Date(formData.value.startDate)
  );
});

function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function timestampToDateStr(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

async function openDialog() {
  showDialog.value = true;
  
  if (props.initialGoalTitle) {
    formData.value.goalTitle = props.initialGoalTitle;
  }
  if (props.initialGoalDescription) {
    formData.value.goalDescription = props.initialGoalDescription;
  }
  if (props.initialStartDate) {
    formData.value.startDate = timestampToDateStr(props.initialStartDate);
  } else {
    formData.value.startDate = timestampToDateStr(Date.now());
  }
  if (props.initialEndDate) {
    formData.value.endDate = timestampToDateStr(props.initialEndDate);
  } else {
    formData.value.endDate = timestampToDateStr(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  emit('loadQuota');
}

function closeDialog() {
  if (!props.isGenerating) {
    showDialog.value = false;
    resetForm();
  }
}

function resetForm() {
  formData.value = {
    goalTitle: '',
    goalDescription: '',
    startDate: '',
    endDate: '',
    goalContext: '',
  };
  emit('clearError');
}

function handleGenerate() {
  if (!formValid.value || !props.hasQuota) {
    return;
  }

  emit('generate', {
    goalTitle: formData.value.goalTitle,
    goalDescription: formData.value.goalDescription || undefined,
    startDate: dateToTimestamp(formData.value.startDate),
    endDate: dateToTimestamp(formData.value.endDate),
    goalContext: formData.value.goalContext || undefined,
  });
}

watch(() => showDialog.value, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});

defineExpose({
  openDialog,
  closeDialog,
});
</script>
