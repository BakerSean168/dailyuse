<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot name="activator" :open="() => (isOpen = true)">
        <Button>
          <Target class="w-4 h-4 mr-2" />
          启用专注模式
        </Button>
      </slot>
    </DialogTrigger>

    <DialogContent class="max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between">
          启用专注模式
        </DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Goal Selection -->
        <div class="space-y-2">
          <Label for="goals">选择专注目标</Label>
          <Select
            v-model="(formData.focusedGoalIds as any)"
          >
            <SelectTrigger id="goals">
              <SelectValue placeholder="请选择 1-3 个目标" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="goal in availableGoals"
                :key="goal.id"
                :value="goal.id"
              >
                {{ goal.title }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            选择 1-3 个你想要专注完成的目标
          </p>
        </div>

        <!-- Start Time -->
        <div class="space-y-2">
          <Label for="startTime">开始时间</Label>
          <Input
            id="startTime"
            v-model="formData.startTime"
            type="datetime-local"
          />
          <p class="text-sm text-muted-foreground">
            专注周期的开始时间
          </p>
        </div>

        <!-- End Time -->
        <div class="space-y-2">
          <Label for="endTime">结束时间</Label>
          <Input
            id="endTime"
            v-model="formData.endTime"
            type="datetime-local"
          />
          <p class="text-sm text-muted-foreground">
            专注周期的结束时间（建议 14-30 天）
          </p>
        </div>

        <!-- Hidden Goals Mode -->
        <div class="space-y-2">
          <Label for="hiddenMode">隐藏目标模式</Label>
          <Select v-model="formData.hiddenGoalsMode">
            <SelectTrigger id="hiddenMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in hiddenModeOptions"
                :key="option.value"
                :value="option.value"
              >
                <div class="flex items-center gap-2">
                  <component :is="option.icon" class="w-4 h-4" />
                  <div>
                    <div>{{ option.label }}</div>
                    <div class="text-xs text-muted-foreground">{{ option.description }}</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            控制非专注目标的显示方式
          </p>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isLoading">
          取消
        </Button>
        <Button
          @click="handleSubmit"
          :disabled="!isFormValid || isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          启用专注模式
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Target, EyeOff, FolderX, Eye, Loader2 } from 'lucide-vue-next';
import type { FocusModeClientDTO, ActivateFocusModeRequest, HiddenGoalsMode } from '@dailyuse/contracts/goal';
import type { GoalId } from '@dailyuse/contracts/primitives';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailyuse/ui-vue-shadcn';

interface Props {
  modelValue?: boolean;
  goals?: Array<{ id: string; title: string }>;
  onActivate?: (request: ActivateFocusModeRequest) => Promise<FocusModeClientDTO>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  goals: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  activated: [focusMode: FocusModeClientDTO];
}>();

const isLoading = ref(false);
const formData = ref({
  focusedGoalIds: [] as string[],
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  hiddenGoalsMode: 'hide' as HiddenGoalsMode,
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const availableGoals = computed(() => props.goals);

const isFormValid = computed(() => {
  const { focusedGoalIds, startTime, endTime } = formData.value;
  return (
    focusedGoalIds.length > 0 &&
    focusedGoalIds.length <= 3 &&
    !!startTime &&
    !!endTime &&
    new Date(endTime).getTime() > new Date(startTime).getTime()
  );
});

const hiddenModeOptions = [
  {
    value: 'hide' as const,
    label: '隐藏',
    description: '隐藏所有非专注目标',
    icon: EyeOff,
  },
  {
    value: 'dim' as const,
    label: '变暗',
    description: '只降低非专注目标的可见度',
    icon: FolderX,
  },
  {
    value: 'collapse' as const,
    label: '折叠',
    description: '仅折叠非专注目标，不完全隐藏',
    icon: Eye,
  },
];

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    isLoading.value = true;
    const request: ActivateFocusModeRequest = {
      focusedGoalIds: formData.value.focusedGoalIds as GoalId[],
      endTime: new Date(formData.value.endTime).getTime(),
      hiddenGoalsMode: formData.value.hiddenGoalsMode,
    };

    if (props.onActivate) {
      const focusMode = await props.onActivate(request);
      emit('activated', focusMode);
      handleClose();
    } else {
      emit('activated', request as any);
      handleClose();
    }
  } catch (err) {
    console.error('Failed to activate focus mode', err);
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    focusedGoalIds: [],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    hiddenGoalsMode: 'hide',
  };
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      resetForm();
    }
  },
);
</script>
