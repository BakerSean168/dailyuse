<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot name="activator" :open="() => (isOpen = true)">
        <Button>
          <Target class="w-4 h-4 mr-2" />
          {{ t('goal.focusMode.activateDialog.title') }}
        </Button>
      </slot>
    </DialogTrigger>

    <DialogContent class="max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between">
          {{ t('goal.focusMode.activateDialog.title') }}
        </DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Goal Selection -->
        <div class="space-y-2">
          <Label for="goals">{{ t('goal.focusMode.activateDialog.selectGoal') }}</Label>
          <Select v-model="formData.focusedGoalIds as any">
            <SelectTrigger id="goals">
              <SelectValue
                :placeholder="t('goal.focusMode.activateDialog.selectGoalPlaceholder')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="goal in availableGoals" :key="goal.id" :value="goal.id">
                {{ goal.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.selectGoalHint') }}
          </p>
        </div>

        <!-- Start Time -->
        <div class="space-y-2">
          <Label for="startTime">{{ t('goal.focusMode.activateDialog.startTime') }}</Label>
          <Input id="startTime" v-model="formData.startTime" type="datetime-local" />
          <p class="text-sm text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.startTimeHint') }}
          </p>
        </div>

        <!-- End Time -->
        <div class="space-y-2">
          <Label for="endTime">{{ t('goal.focusMode.activateDialog.endTime') }}</Label>
          <Input id="endTime" v-model="formData.endTime" type="datetime-local" />
          <p class="text-sm text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.endTimeHint') }}
          </p>
        </div>

        <!-- Hidden Goals Mode -->
        <div class="space-y-2">
          <Label for="hiddenMode">{{ t('goal.focusMode.activateDialog.hiddenMode') }}</Label>
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
            {{ t('goal.focusMode.activateDialog.hiddenModeHint') }}
          </p>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="isLoading">
          {{ t('goal.focusMode.activateDialog.cancel') }}
        </Button>
        <Button @click="handleSubmit" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          {{ t('goal.focusMode.activateDialog.activate') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Target, EyeOff, FolderX, Eye, Loader2 } from 'lucide-vue-next';
import type { FocusModeClientDTO, ActivateFocusModeRequest } from '@dailyuse/contracts/goal';
import { GoalId, HiddenGoalsMode } from '@dailyuse/goal/domain-shared';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    goals?: Array<{ id: string; name: string }>;
    onActivate?: (request: ActivateFocusModeRequest) => Promise<FocusModeClientDTO>;
  }>(),
  {
    modelValue: false,
    goals: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  activated: [focusMode: FocusModeClientDTO];
}>();

const { t } = useI18n();

const isLoading = ref(false);
const formData = ref({
  focusedGoalIds: [] as GoalId[],
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  hiddenGoalsMode: HiddenGoalsMode.Hide,
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

const hiddenModeOptions = computed(() => [
  {
    value: HiddenGoalsMode.Hide,
    label: t('goal.focusMode.activateDialog.modeHide'),
    description: t('goal.focusMode.activateDialog.modeHideDesc'),
    icon: EyeOff,
  },
  {
    value: HiddenGoalsMode.Dim,
    label: t('goal.focusMode.activateDialog.modeDim'),
    description: t('goal.focusMode.activateDialog.modeDimDesc'),
    icon: FolderX,
  },
  {
    value: HiddenGoalsMode.Collapse,
    label: t('goal.focusMode.activateDialog.modeFold'),
    description: t('goal.focusMode.activateDialog.modeFoldDesc'),
    icon: Eye,
  },
]);

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    isLoading.value = true;
    const request: ActivateFocusModeRequest = {
      focusedGoalIds: formData.value.focusedGoalIds,
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
    hiddenGoalsMode: HiddenGoalsMode.Hide,
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
