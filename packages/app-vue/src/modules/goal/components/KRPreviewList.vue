<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center mb-4">
      <Lightbulb class="w-5 h-5 text-primary mr-2" />
      <h3 class="text-lg font-semibold">{{ t('goal.krPreview.title') }}</h3>
      <div class="flex-1" />
      <Badge variant="default" class="flex items-center gap-1">
        <CheckCircle class="w-3 h-3" />
        {{ selectedCount }} / {{ keyResults.length }} {{ t('goal.krPreview.selected') }}
      </Badge>
    </div>

    <!-- Empty State -->
    <Alert v-if="keyResults.length === 0" class="mb-4">
      <Info class="w-4 h-4" />
      <AlertTitle>{{ t('goal.krPreview.empty') }}</AlertTitle>
      <AlertDescription> {{ t('goal.krPreview.emptyHint') }} </AlertDescription>
    </Alert>

    <!-- Results List -->
    <div v-else class="space-y-3" data-testid="kr-preview-list">
      <ActionableWrapper
        v-for="(kr, index) in keyResults"
        :key="kr.id || index"
        :actions="getKRActions(kr, index)"
        more-button-position="top-right"
      >
        <Card
          :class="[
            'p-4 transition-all',
            kr.selected ? 'border-primary bg-primary/5' : 'opacity-60',
          ]"
          data-testid="kr-preview-item"
        >
          <div class="flex items-start gap-3">
            <!-- Checkbox -->
            <Checkbox
              :checked="kr.selected"
              @update:checked="(val) => handleSelectionChange(kr, val)"
              data-testid="kr-checkbox"
              class="mt-1"
            />

            <div class="flex-1">
              <!-- Title -->
              <div class="flex items-center gap-2 mb-2">
                <Target class="w-4 h-4 text-primary" />
                <strong>{{ kr.title }}</strong>
              </div>

              <!-- Metrics -->
              <div class="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" class="text-success border-success">
                  <Flag class="w-3 h-3 mr-1" />
                  {{ t('goal.krPreview.targetLabel') }}{{ kr.targetValue }} {{ kr.unit }}
                </Badge>

                <Badge v-if="kr.weight" variant="outline" class="text-info border-info">
                  <Scale class="w-3 h-3 mr-1" />
                  {{ t('goal.krPreview.weightLabel') }}{{ kr.weight }}%
                </Badge>

                <Badge
                  v-if="kr.importance"
                  variant="outline"
                  :class="getImportanceClass(kr.importance)"
                >
                  <Star class="w-3 h-3 mr-1" />
                  {{ getImportanceLabel(kr.importance) }}
                </Badge>
              </div>

              <!-- Description -->
              <div v-if="kr.description" class="mt-3 text-sm text-muted-foreground">
                <FileText class="w-3 h-3 inline mr-1" />
                {{ kr.description }}
              </div>
            </div>
          </div>
        </Card>
      </ActionableWrapper>
    </div>

    <!-- Batch Actions -->
    <div v-if="keyResults.length > 0" class="flex gap-2 mt-4">
      <Button variant="outline" size="sm" @click="selectAll" data-testid="select-all-button">
        <CheckSquare class="w-4 h-4 mr-2" />
        {{ t('goal.krPreview.selectAll') }}
      </Button>
      <Button variant="outline" size="sm" @click="deselectAll" data-testid="deselect-all-button">
        <Square class="w-4 h-4 mr-2" />
        {{ t('goal.krPreview.deselectAll') }}
      </Button>
      <div class="flex-1" />
      <Button
        variant="outline"
        size="sm"
        @click="clearAll"
        :disabled="keyResults.length === 0"
        data-testid="clear-all-button"
      >
        <XCircle class="w-4 h-4 mr-2" />
        {{ t('goal.krPreview.clearList') }}
      </Button>
      <Button
        size="sm"
        @click="handleAccept"
        :disabled="selectedCount === 0"
        data-testid="accept-button"
      >
        <CheckCircle class="w-4 h-4 mr-2" />
        {{ t('goal.krPreview.adoptSelected') }} ({{ selectedCount }})
      </Button>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog" data-testid="kr-edit-dialog">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Pencil class="w-5 h-5" />
            {{ t('goal.krPreview.editTitle') }}
          </DialogTitle>
        </DialogHeader>

        <div v-if="editingKR" class="space-y-4">
          <div class="space-y-2">
            <Label for="title">{{ t('goal.krPreview.fieldTitle') }}</Label>
            <Input
              id="title"
              v-model="editingKR.title"
              :placeholder="t('goal.krPreview.titlePlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">{{ t('goal.krPreview.fieldDesc') }}</Label>
            <Textarea
              id="description"
              v-model="editingKR.description"
              rows="3"
              :placeholder="t('goal.krPreview.descPlaceholder')"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="targetValue">{{ t('goal.krPreview.fieldTarget') }}</Label>
              <Input
                id="targetValue"
                v-model.number="editingKR.targetValue"
                type="number"
                :placeholder="t('goal.krPreview.targetPlaceholder')"
              />
            </div>

            <div class="space-y-2">
              <Label for="unit">{{ t('goal.krPreview.fieldUnit') }}</Label>
              <Input
                id="unit"
                v-model="editingKR.unit"
                :placeholder="t('goal.krPreview.unitPlaceholder')"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="weight">{{ t('goal.krPreview.fieldWeight') }}</Label>
              <Input
                id="weight"
                v-model.number="editingKR.weight"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
              />
            </div>

            <div class="space-y-2">
              <Label for="importance">{{ t('goal.krPreview.fieldImportance') }}</Label>
              <Select v-model="editingKR.importance">
                <SelectTrigger id="importance">
                  <SelectValue :placeholder="t('goal.krPreview.selectImportance')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{{ t('goal.krPreview.importanceHigh') }}</SelectItem>
                  <SelectItem value="medium">{{ t('goal.krPreview.importanceMedium') }}</SelectItem>
                  <SelectItem value="low">{{ t('goal.krPreview.importanceLow') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="cancelEdit">{{ t('goal.krPreview.cancel') }}</Button>
          <Button @click="saveEdit" :disabled="!isEditFormValid">{{
            t('goal.krPreview.save')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Lightbulb,
  CheckCircle,
  Info,
  Target,
  Flag,
  Scale,
  Star,
  FileText,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  XCircle,
} from 'lucide-vue-next';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Card } from '@dailyuse/ui-vue-shadcn';
import { Checkbox } from '@dailyuse/ui-vue-shadcn';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea, useConfirm } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { KeyResultDraft, KeyResultPreview } from '../types';

const props = defineProps<{
  results?: KeyResultDraft[];
  onSuccess?: (message: string) => void;
  onWarning?: (message: string) => void;
}>();

const emit = defineEmits<{
  accept: [results: KeyResultPreview[]];
  remove: [index: number];
  edit: [index: number, kr: KeyResultPreview];
  selectionChange: [selectedResults: KeyResultPreview[]];
}>();

const keyResults = ref<KeyResultPreview[]>([]);
const { t } = useI18n();
const showEditDialog = ref(false);
const editingKR = ref<KeyResultPreview | null>(null);
const editingIndex = ref(-1);

const selectedCount = computed(() => {
  return keyResults.value.filter((kr) => kr.selected).length;
});

const selectedResults = computed(() => {
  return keyResults.value.filter((kr) => kr.selected);
});

const isEditFormValid = computed(() => {
  return (
    editingKR.value &&
    editingKR.value.title &&
    editingKR.value.targetValue > 0 &&
    editingKR.value.unit
  );
});

function loadResults(results: KeyResultDraft[]) {
  keyResults.value = results.map((kr) => ({
    id: kr.id || crypto.randomUUID(),
    title: kr.title || '',
    description: kr.description || '',
    targetValue: kr.targetValue || 0,
    unit: kr.unit || '',
    weight: kr.weight,
    importance: kr.importance,
    selected: true,
  }));
}

function handleSelectionChange(kr: KeyResultPreview, selected: boolean) {
  kr.selected = selected;
  emit('selectionChange', selectedResults.value);
}

function selectAll() {
  keyResults.value.forEach((kr) => (kr.selected = true));
  emit('selectionChange', selectedResults.value);
}

function deselectAll() {
  keyResults.value.forEach((kr) => (kr.selected = false));
  emit('selectionChange', selectedResults.value);
}

async function clearAll() {
  const confirmed = await useConfirm({
    title: t('goal.krPreview.confirmClearTitle'),
    description: t('goal.krPreview.confirmClear'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  keyResults.value = [];
  emit('selectionChange', []);
  props.onSuccess?.(t('goal.krPreview.cleared'));
}

function handleEdit(kr: KeyResultPreview, index: number) {
  editingKR.value = { ...kr };
  editingIndex.value = index;
  showEditDialog.value = true;
}

function cancelEdit() {
  showEditDialog.value = false;
  editingKR.value = null;
  editingIndex.value = -1;
}

function saveEdit() {
  if (!isEditFormValid.value || editingKR.value === null) {
    return;
  }

  keyResults.value[editingIndex.value] = { ...editingKR.value };
  emit('edit', editingIndex.value, editingKR.value);
  props.onSuccess?.(t('goal.krPreview.updated'));
  cancelEdit();
}

async function handleRemove(index: number) {
  const confirmed = await useConfirm({
    title: t('goal.krPreview.confirmRemoveTitle'),
    description: t('goal.krPreview.confirmRemove'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  keyResults.value.splice(index, 1);
  emit('remove', index);
  props.onSuccess?.(t('goal.krPreview.removed'));
}

function getKRActions(kr: KeyResultPreview, index: number): MenuAction[] {
  return [
    {
      key: 'edit',
      label: menuLabel('edit'),
      icon: Pencil,
      handler: () => handleEdit(kr, index),
    },
    {
      key: 'delete',
      label: menuLabel('delete'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => handleRemove(index),
    },
  ];
}

function handleAccept() {
  if (selectedCount.value === 0) {
    props.onWarning?.(t('goal.krPreview.selectAtLeastOne'));
    return;
  }

  emit('accept', selectedResults.value);
}

function getImportanceClass(importance: string): string {
  switch (importance) {
    case 'high':
      return 'text-destructive border-destructive';
    case 'medium':
      return 'text-warning border-warning';
    case 'low':
      return 'text-success border-success';
    default:
      return '';
  }
}

function getImportanceLabel(importance: string): string {
  switch (importance) {
    case 'high':
      return t('goal.krPreview.importanceHigh');
    case 'medium':
      return t('goal.krPreview.importanceMedium');
    case 'low':
      return t('goal.krPreview.importanceLow');
    default:
      return importance;
  }
}

watch(
  () => props.results,
  (newResults) => {
    if (newResults && newResults.length > 0) {
      loadResults(newResults);
    }
  },
  { immediate: true },
);

defineExpose({
  loadResults,
  selectAll,
  deselectAll,
  clearAll,
});
</script>
