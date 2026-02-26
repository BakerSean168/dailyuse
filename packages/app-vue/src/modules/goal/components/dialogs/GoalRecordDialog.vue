<template>
  <Dialog :open="visible" @update:open="(val) => (visible = val)">
    <DialogContent class="sm:max-w-[600px] gap-0 p-0">
      <!-- 对话框头部 -->
      <div class="flex items-center justify-between px-6 pt-6 pb-4">
        <Button variant="ghost" size="sm" @click="handleCancel">
          <X class="mr-1 h-4 w-4" />
          取消
        </Button>
        <div class="flex items-center">
          <PlusCircle class="mr-2 h-5 w-5 text-primary" />
          <span class="text-lg font-bold">{{ isEditing ? '编辑记录' : '添加记录' }}</span>
        </div>
        <Button size="sm" :disabled="!isValid" @click="handleSave">
          <Check class="mr-1 h-4 w-4" />
          保存
        </Button>
      </div>

      <Separator />

      <!-- 表单内容 -->
      <form class="flex flex-col gap-6 p-6" @submit.prevent="handleSave">
        <!-- 增加值输入 -->
        <div class="space-y-2">
          <Label for="change-amount">增加值</Label>
          <div class="relative flex items-center">
            <Plus class="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="change-amount"
              v-model.number="localRecord.changeAmount"
              type="number"
              class="pl-9 pr-16"
              min="0.1"
              step="0.1"
            />
            <Badge variant="secondary" class="absolute right-3 font-medium"> 单位 </Badge>
          </div>
          <p v-if="validationError" class="text-xs text-destructive">{{ validationError }}</p>
        </div>

        <!-- 备注输入 -->
        <div class="space-y-2">
          <Label for="record-note" class="flex items-center gap-1">
            <FileText class="h-4 w-4 text-muted-foreground" />
            备注说明
          </Label>
          <Textarea
            id="record-note"
            v-model="localRecord.note"
            placeholder="添加关于此次记录的详细说明..."
            :rows="3"
            class="resize-none"
          />
        </div>

        <!-- 快速选择值 -->
        <div>
          <div class="mb-3 flex items-center text-sm text-muted-foreground">
            <Zap class="mr-1 h-4 w-4" />
            快速选择
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="quickValue in quickValues"
              :key="quickValue"
              :variant="localRecord.changeAmount === quickValue ? 'default' : 'outline'"
              class="cursor-pointer select-none px-3 py-1 text-sm transition-shadow hover:shadow-md"
              @click="localRecord.changeAmount = quickValue"
            >
              {{ quickValue }}
            </Badge>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import { Dialog, DialogContent } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { X, PlusCircle, Check, Plus, FileText, Zap } from 'lucide-vue-next';
// composables
import { useGoal } from '../../composables/useGoal';

const { createGoalRecord, goals } = useGoal();

const visible = ref(false);
const propKeyResultId = ref<string>('');
const propGoalId = ref<string>('');
const propRecord = ref<GoalRecordClientDTO | null>(null);

const quickValues = [1, 2, 5, 10];

// 本地表单数据：只需要 changeAmount 和 note
const localRecord = ref({
  changeAmount: 0,
  note: '',
});

const isEditing = computed(() => !!propRecord.value);

const valueRules = [
  (v: number) => !!v || '增加值不能为空',
  (v: number) => v > 0 || '增加值必须大于0',
  (v: number) => v <= 10000 || '增加值不能超过10000',
];

const validationError = computed(() => {
  const v = localRecord.value.changeAmount;
  for (const rule of valueRules) {
    const result = rule(v);
    if (result !== true) return result;
  }
  return '';
});

const isValid = computed(() => !validationError.value && localRecord.value.changeAmount > 0);

const handleCreateKeyResult = async () => {
  // 获取当前 KeyResult
  const currentGoal = goals.value.find((g: any) => g.id === propGoalId.value);
  if (!currentGoal) {
    console.error('未找到目标');
    return;
  }

  const currentKeyResult = currentGoal.keyResults?.find(
    (kr: any) => kr.id === propKeyResultId.value,
  );
  if (!currentKeyResult) {
    console.error('未找到关键结果');
    return;
  }

  // ✅ 新的数据模型：value 就是本次记录的独立值
  // 不需要再加上 previousValue
  await createGoalRecord(propGoalId.value, propKeyResultId.value, {
    value: localRecord.value.changeAmount, // ✅ 直接传递用户输入的值
    note: localRecord.value.note,
    recordedAt: Date.now(),
  });
};

const handleSave = () => {
  if (!isValid.value) return;

  if (isEditing.value) {
    console.warn('不允许编辑记录');
  } else {
    handleCreateKeyResult();
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};

const openDialog = (goalId: string, keyResultId: string, record?: GoalRecordClientDTO) => {
  propGoalId.value = goalId;
  propKeyResultId.value = keyResultId;
  propRecord.value = record || null;
  visible.value = true;
};

const closeDialog = () => {
  visible.value = false;
};

// 监听弹窗显示，重置表单
watch(
  () => visible.value,
  (show) => {
    if (show) {
      if (propRecord.value) {
        // 编辑模式：显示已有记录
        localRecord.value = {
          changeAmount: propRecord.value.value, // 使用 value 属性
          note: propRecord.value.comment || '',
        };
      } else {
        // 创建模式：重置表单
        localRecord.value = {
          changeAmount: 0,
          note: '',
        };
      }
    }
  },
);

defineExpose({
  openDialog,
});
</script>
