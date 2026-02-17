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
            v-model="formData.focusedGoalUuids"
            multiple
          >
            <SelectTrigger id="goals">
              <SelectValue placeholder="请选择 1-3 个目标" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="goal in availableGoals"
                :key="goal.uuid"
                :value="goal.uuid"
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
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface Props {
  modelValue?: boolean;
  goals?: Array<{ uuid: string; title: string }>;
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
  focusedGoalUuids: [] as string[],
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  hiddenGoalsMode: 'hide_all' as HiddenGoalsMode,
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const availableGoals = computed(() => props.goals);

const isFormValid = computed(() => {
  const { focusedGoalUuids, startTime, endTime } = formData.value;
  return (
    focusedGoalUuids.length > 0 &&
    focusedGoalUuids.length <= 3 &&
    !!startTime &&
    !!endTime &&
    new Date(endTime).getTime() > new Date(startTime).getTime()
  );
});

const hiddenModeOptions = [
  {
    value: 'hide_all',
    label: '隐藏所有',
    description: '隐藏所有非专注目标',
    icon: EyeOff,
  },
  {
    value: 'hide_folder',
    label: '隐藏文件夹',
    description: '只隐藏非专注目标的文件夹层级',
    icon: FolderX,
  },
  {
    value: 'hide_none',
    label: '不隐藏',
    description: '仅标记专注目标，不隐藏其他目标',
    icon: Eye,
  },
];

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    isLoading.value = true;
    const request: ActivateFocusModeRequest = {
      focusedGoalUuids: formData.value.focusedGoalUuids,
      endTime: new Date(formData.value.endTime).getTime(),
      hiddenGoalsMode: formData.value.hiddenGoalsMode as any,
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
    focusedGoalUuids: [],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    hiddenGoalsMode: 'hide_all',
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
