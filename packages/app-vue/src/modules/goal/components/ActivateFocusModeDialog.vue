<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-between">
          {{ t('goal.focusMode.activateDialog.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('goal.focusMode.activateDialog.dialogDescription') }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Goal Selection -->
        <div class="space-y-2">
          <Label for="goals">{{ t('goal.focusMode.activateDialog.selectGoal') }}</Label>
          <div
            v-if="availableGoals.length === 0"
            class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
          >
            {{ t('goal.focusMode.activateDialog.emptyGoals') }}
          </div>
          <div v-else class="grid max-h-60 gap-2 overflow-auto rounded-lg border p-3">
            <label v-for="goal in availableGoals" :key="goal.id" class="flex items-start gap-2">
              <input
                :checked="formData.focusedGoalIds.includes(goal.id)"
                type="checkbox"
                :disabled="
                  !formData.focusedGoalIds.includes(goal.id) && formData.focusedGoalIds.length >= 3
                "
                @change="toggleGoal(goal.id)"
              />
              <span class="min-w-0">
                <span class="block truncate">{{ goal.name }}</span>
              </span>
            </label>
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.selectGoalHint') }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ t('goal.focusMode.activateDialog.autoEndHint') }}
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
import { EyeOff, FolderX, Eye, Loader2 } from 'lucide-vue-next';
import type { FocusModeDTO, ActivateFocusModeRequest } from '@dailyuse/contracts/goal';
import { GoalId, HiddenGoalsMode } from '@dailyuse/goal/domain-shared';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
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
    goals?: Array<{ id: GoalId; name: string }>;
    onActivate?: (request: ActivateFocusModeRequest) => Promise<FocusModeDTO>;
  }>(),
  {
    modelValue: false,
    goals: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  activated: [focusMode: FocusModeDTO];
}>();

const { t } = useI18n();

const isLoading = ref(false);
const formData = ref({
  focusedGoalIds: [] as GoalId[],
  hiddenGoalsMode: HiddenGoalsMode.Hide,
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const availableGoals = computed(() => props.goals);

const isFormValid = computed(() => {
  const { focusedGoalIds } = formData.value;
  return focusedGoalIds.length > 0 && focusedGoalIds.length <= 3;
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

const toggleGoal = (goalId: GoalId) => {
  const ids = formData.value.focusedGoalIds;
  if (ids.includes(goalId)) {
    formData.value.focusedGoalIds = ids.filter((id) => id !== goalId);
    return;
  }

  if (ids.length >= 3) return;
  formData.value.focusedGoalIds = [...ids, goalId as GoalId];
};

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
      if (focusMode && typeof focusMode === 'object' && 'id' in focusMode) {
        emit('activated', focusMode);
        handleClose();
      }
    } else {
      emit('activated', request as any);
      handleClose();
    }
  } catch (err) {
    console.error('启用专注模式失败', err);
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
