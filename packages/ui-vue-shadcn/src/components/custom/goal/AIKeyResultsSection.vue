<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center mb-4">
      <h2 class="text-2xl font-semibold flex items-center gap-2">
        <Target class="w-6 h-6 text-primary" />
        关键结果管理
      </h2>
      <div class="flex-1" />
      
      <!-- AI Generate Button -->
      <AIGenerateKRButton
        ref="generateButtonRef"
        :initial-goal-title="goalTitle"
        :initial-goal-description="goalDescription"
        @generated="handleGenerated"
        @error="handleError"
        data-testid="ai-generate-kr-button-section"
      />
    </div>

    <!-- Usage Hint -->
    <Alert
      v-if="showHint && !hasGeneratedResults"
      class="mb-4"
      data-testid="usage-hint"
    >
      <Lightbulb class="w-4 h-4" />
      <AlertTitle>提示</AlertTitle>
      <AlertDescription>
        点击"AI 生成关键结果"按钮，让 AI 帮你智能生成可量化的关键结果，
        你可以预览、编辑后再采纳。
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        class="absolute top-2 right-2"
        @click="showHint = false"
      >
        <X class="w-4 h-4" />
      </Button>
    </Alert>

    <!-- Key Results Preview List -->
    <KRPreviewList
      ref="previewListRef"
      :results="generatedResults"
      @accept="handleAccept"
      @edit="handleEdit"
      @remove="handleRemove"
      @selectionChange="handleSelectionChange"
      data-testid="kr-preview-list-section"
    />

    <!-- Accepted Results -->
    <div v-if="acceptedResults.length > 0" class="mt-6">
      <Separator class="mb-4" />
      
      <div class="flex items-center mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-success" />
          已采纳的关键结果
        </h3>
        <Badge variant="success" class="ml-2">
          {{ acceptedResults.length }} 个
        </Badge>
      </div>

      <div class="space-y-2" data-testid="accepted-results-list">
        <Card
          v-for="(kr, index) in acceptedResults"
          :key="kr.uuid || index"
          class="p-4"
          data-testid="accepted-kr-item"
        >
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            
            <div class="flex-1">
              <div class="font-semibold mb-2">{{ kr.title }}</div>
              
              <div class="flex flex-wrap gap-2">
                <Badge variant="outline" class="text-success border-success">
                  目标：{{ kr.targetValue }} {{ kr.unit }}
                </Badge>
                <Badge v-if="kr.weight" variant="outline" class="text-info border-info">
                  权重：{{ kr.weight }}%
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              @click="handleRemoveAccepted(index)"
              data-testid="remove-accepted-button"
            >
              <X class="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Manual Add Button -->
    <div class="mt-4">
      <Button
        variant="outline"
        @click="handleManualAdd"
        data-testid="manual-add-button"
      >
        <Plus class="w-4 h-4 mr-2" />
        手动添加关键结果
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Target, Lightbulb, CheckCircle, X, Plus } from 'lucide-vue-next';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Separator } from '../../ui/separator';
import AIGenerateKRButton from './AIGenerateKRButton.vue';
import KRPreviewList from './KRPreviewList.vue';

interface KeyResultData {
  uuid?: string;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight?: number;
  importance?: string;
  selected?: boolean;
}

interface Props {
  goalTitle?: string;
  goalDescription?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  resultsUpdated: [results: KeyResultData[]];
  manualAdd: [];
}>();

const generateButtonRef = ref();
const previewListRef = ref();
const showHint = ref(true);
const generatedResults = ref<any[]>([]);
const acceptedResults = ref<KeyResultData[]>([]);
const selectedResults = ref<KeyResultData[]>([]);

const hasGeneratedResults = computed(() => generatedResults.value.length > 0);

function handleGenerated(result: any) {
  console.log('✅ AI 生成成功:', result);
  
  if (result.keyResults && Array.isArray(result.keyResults)) {
    generatedResults.value = result.keyResults;
    props.onSuccess?.(`成功生成 ${result.keyResults.length} 个关键结果！`);
  }
}

function handleError(error: string) {
  console.error('❌ AI 生成失败:', error);
  props.onError?.(error);
}

function handleAccept(results: KeyResultData[]) {
  console.log('✅ 采纳关键结果:', results);
  
  acceptedResults.value.push(...results);
  generatedResults.value = [];
  
  emit('resultsUpdated', acceptedResults.value);
  props.onSuccess?.(`已采纳 ${results.length} 个关键结果`);
}

function handleEdit(index: number, kr: KeyResultData) {
  console.log('✏️ 编辑关键结果:', index, kr);
}

function handleRemove(index: number) {
  console.log('🗑️ 移除关键结果:', index);
}

function handleSelectionChange(selected: KeyResultData[]) {
  selectedResults.value = selected;
  console.log('📋 选择变更:', selected.length);
}

function handleRemoveAccepted(index: number) {
  if (confirm('确定要移除这个已采纳的关键结果吗？')) {
    acceptedResults.value.splice(index, 1);
    emit('resultsUpdated', acceptedResults.value);
    props.onSuccess?.('已移除');
  }
}

function handleManualAdd() {
  emit('manualAdd');
}

function openGenerateDialog() {
  generateButtonRef.value?.openDialog();
}

function clearAll() {
  generatedResults.value = [];
  acceptedResults.value = [];
  selectedResults.value = [];
  emit('resultsUpdated', []);
}

function getAcceptedResults() {
  return acceptedResults.value;
}

function setAcceptedResults(results: KeyResultData[]) {
  acceptedResults.value = results;
}

watch([() => props.goalTitle, () => props.goalDescription], () => {
  console.log('📝 目标信息更新:', {
    title: props.goalTitle,
    description: props.goalDescription,
  });
});

defineExpose({
  openGenerateDialog,
  clearAll,
  getAcceptedResults,
  setAcceptedResults,
});
</script>
