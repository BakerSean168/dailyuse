<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center mb-4">
      <Lightbulb class="w-5 h-5 text-primary mr-2" />
      <h3 class="text-lg font-semibold">AI 生成的关键结果预览</h3>
      <div class="flex-1" />
      <Badge variant="default" class="flex items-center gap-1">
        <CheckCircle class="w-3 h-3" />
        {{ selectedCount }} / {{ keyResults.length }} 已选择
      </Badge>
    </div>

    <!-- Empty State -->
    <Alert v-if="keyResults.length === 0" class="mb-4">
      <Info class="w-4 h-4" />
      <AlertTitle>暂无生成的关键结果</AlertTitle>
      <AlertDescription>
        请点击"AI 生成关键结果"按钮开始。
      </AlertDescription>
    </Alert>

    <!-- Results List -->
    <div v-else class="space-y-3" data-testid="kr-preview-list">
      <Card
        v-for="(kr, index) in keyResults"
        :key="kr.id || index"
        :class="[
          'p-4 transition-all',
          kr.selected ? 'border-primary bg-primary/5' : 'opacity-60'
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
                目标：{{ kr.targetValue }} {{ kr.unit }}
              </Badge>

              <Badge v-if="kr.weight" variant="outline" class="text-info border-info">
                <Scale class="w-3 h-3 mr-1" />
                权重：{{ kr.weight }}%
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

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="handleEdit(kr, index)"
              data-testid="kr-edit-button"
            >
              <Pencil class="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-destructive"
              @click="handleRemove(index)"
              data-testid="kr-remove-button"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Batch Actions -->
    <div v-if="keyResults.length > 0" class="flex gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        @click="selectAll"
        data-testid="select-all-button"
      >
        <CheckSquare class="w-4 h-4 mr-2" />
        全选
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="deselectAll"
        data-testid="deselect-all-button"
      >
        <Square class="w-4 h-4 mr-2" />
        全不选
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
        清空列表
      </Button>
      <Button
        size="sm"
        @click="handleAccept"
        :disabled="selectedCount === 0"
        data-testid="accept-button"
      >
        <CheckCircle class="w-4 h-4 mr-2" />
        采纳选中的结果 ({{ selectedCount }})
      </Button>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog" data-testid="kr-edit-dialog">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Pencil class="w-5 h-5" />
            编辑关键结果
          </DialogTitle>
        </DialogHeader>

        <div v-if="editingKR" class="space-y-4">
          <div class="space-y-2">
            <Label for="title">标题 *</Label>
            <Input
              id="title"
              v-model="editingKR.title"
              placeholder="输入标题"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">描述（可选）</Label>
            <Textarea
              id="description"
              v-model="editingKR.description"
              rows="3"
              placeholder="输入描述"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="targetValue">目标值 *</Label>
              <Input
                id="targetValue"
                v-model.number="editingKR.targetValue"
                type="number"
                placeholder="输入目标值"
              />
            </div>

            <div class="space-y-2">
              <Label for="unit">单位 *</Label>
              <Input
                id="unit"
                v-model="editingKR.unit"
                placeholder="输入单位"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="weight">权重（可选）</Label>
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
              <Label for="importance">重要性（可选）</Label>
              <Select v-model="editingKR.importance">
                <SelectTrigger id="importance">
                  <SelectValue placeholder="选择重要性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="cancelEdit">取消</Button>
          <Button @click="saveEdit" :disabled="!isEditFormValid">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

export interface KeyResultPreview {
  id?: string;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight?: number;
  importance?: string;
  selected: boolean;
}

const props = defineProps<{
  results?: any[];
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
const showEditDialog = ref(false);
const editingKR = ref<KeyResultPreview | null>(null);
const editingIndex = ref(-1);

const selectedCount = computed(() => {
  return keyResults.value.filter(kr => kr.selected).length;
});

const selectedResults = computed(() => {
  return keyResults.value.filter(kr => kr.selected);
});

const isEditFormValid = computed(() => {
  return editingKR.value &&
    editingKR.value.title &&
    editingKR.value.targetValue > 0 &&
    editingKR.value.unit;
});

function loadResults(results: any[]) {
  keyResults.value = results.map((kr: any) => ({
    id: kr.id || crypto.randomUUID(),
    title: kr.title || kr.name || '',
    description: kr.description || '',
    targetValue: kr.targetValue || kr.target || 0,
    unit: kr.unit || '',
    weight: kr.weight || null,
    importance: kr.importance || null,
    selected: true,
  }));
}

function handleSelectionChange(kr: KeyResultPreview, selected: boolean) {
  kr.selected = selected;
  emit('selectionChange', selectedResults.value);
}

function selectAll() {
  keyResults.value.forEach(kr => kr.selected = true);
  emit('selectionChange', selectedResults.value);
}

function deselectAll() {
  keyResults.value.forEach(kr => kr.selected = false);
  emit('selectionChange', selectedResults.value);
}

function clearAll() {
  if (confirm('确定要清空所有生成的关键结果吗？')) {
    keyResults.value = [];
    emit('selectionChange', []);
    props.onSuccess?.('已清空列表');
  }
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
  props.onSuccess?.('关键结果已更新');
  cancelEdit();
}

function handleRemove(index: number) {
  if (confirm('确定要移除这个关键结果吗？')) {
    keyResults.value.splice(index, 1);
    emit('remove', index);
    props.onSuccess?.('已移除');
  }
}

function handleAccept() {
  if (selectedCount.value === 0) {
    props.onWarning?.('请至少选择一个关键结果');
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
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return importance;
  }
}

watch(() => props.results, (newResults) => {
  if (newResults && newResults.length > 0) {
    loadResults(newResults);
  }
}, { immediate: true });

defineExpose({
  loadResults,
  selectAll,
  deselectAll,
  clearAll,
});
</script>
