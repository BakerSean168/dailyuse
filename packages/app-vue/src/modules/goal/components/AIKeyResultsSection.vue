<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center mb-4">
      <h2 class="text-2xl font-semibold flex items-center gap-2">
        <Target class="w-6 h-6 text-primary" />
        {{ t('goal.aiKeyResults.title') }}
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
    <Alert v-if="showHint && !hasGeneratedResults" class="mb-4" data-testid="usage-hint">
      <Lightbulb class="w-4 h-4" />
      <AlertTitle>{{ t('goal.aiKeyResults.hint') }}</AlertTitle>
      <AlertDescription>
        {{ t('goal.aiKeyResults.hintText') }}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        class="absolute top-2 right-2"
        :aria-label="t('common.close')"
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
          {{ t('goal.aiKeyResults.adoptedKR') }}
        </h3>
        <Badge class="ml-2 bg-success/15 text-success hover:bg-success/15">
          {{ acceptedResults.length }} {{ t('goal.aiKeyResults.count') }}
        </Badge>
      </div>

      <div class="space-y-2" data-testid="accepted-results-list">
        <Card
          v-for="(kr, index) in acceptedResults"
          :key="String(kr.id ?? index)"
          class="p-4"
          data-testid="accepted-kr-item"
        >
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-success shrink-0 mt-0.5" />

            <div class="flex-1">
              <div class="font-semibold mb-2">{{ kr.title }}</div>

              <div class="flex flex-wrap gap-2">
                <Badge variant="outline" class="text-success border-success">
                  {{ t('goal.aiKeyResults.target') }}{{ kr.targetValue }} {{ kr.unit }}
                </Badge>
                <Badge v-if="kr.weight" variant="outline" class="text-info border-info">
                  {{ t('goal.aiKeyResults.weight') }}{{ kr.weight }}%
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              :aria-label="t('common.delete')"
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
      <Button variant="outline" @click="handleManualAdd" data-testid="manual-add-button">
        <Plus class="w-4 h-4 mr-2" />
        {{ t('goal.aiKeyResults.manualAdd') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Target, Lightbulb, CheckCircle, X, Plus } from '@lucide/vue';
import { Alert, AlertTitle, AlertDescription } from '@memoflow/ui-vue-shadcn';
import { Badge } from '@memoflow/ui-vue-shadcn';
import { Button } from '@memoflow/ui-vue-shadcn';
import { Card } from '@memoflow/ui-vue-shadcn';
import { Separator } from '@memoflow/ui-vue-shadcn';
import AIGenerateKRButton from './AIGenerateKRButton.vue';
import KRPreviewList from './KRPreviewList.vue';
import type { KeyResultDraft } from '../types';

const props = defineProps<{
  goalTitle?: string;
  goalDescription?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}>();

const emit = defineEmits<{
  resultsUpdated: [results: KeyResultDraft[]];
  manualAdd: [];
}>();

const { t } = useI18n();

const generateButtonRef = ref();
const previewListRef = ref();
const showHint = ref(true);
const generatedResults = ref<KeyResultDraft[]>([]);
const acceptedResults = ref<KeyResultDraft[]>([]);
const selectedResults = ref<KeyResultDraft[]>([]);

const hasGeneratedResults = computed(() => generatedResults.value.length > 0);

function handleGenerated(result: { keyResults?: KeyResultDraft[] }) {
  if (result.keyResults && Array.isArray(result.keyResults)) {
    generatedResults.value = result.keyResults;
    props.onSuccess?.(t('goal.aiKeyResults.generateSuccess', { n: result.keyResults.length }));
  }
}

function handleError(error: string) {
  props.onError?.(error);
}

function handleAccept(results: KeyResultDraft[]) {
  acceptedResults.value.push(...results);
  generatedResults.value = [];

  emit('resultsUpdated', acceptedResults.value);
  props.onSuccess?.(t('goal.aiKeyResults.adoptSuccess', { n: results.length }));
}

function handleEdit(index: number, kr: KeyResultDraft) {
  void index;
  void kr;
}

function handleRemove(index: number) {
  void index;
}

function handleSelectionChange(selected: KeyResultDraft[]) {
  selectedResults.value = selected;
}

function handleRemoveAccepted(index: number) {
  acceptedResults.value.splice(index, 1);
  emit('resultsUpdated', acceptedResults.value);
  props.onSuccess?.(t('goal.aiKeyResults.removed'));
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

function setAcceptedResults(results: KeyResultDraft[]) {
  acceptedResults.value = results;
}

watch([() => props.goalTitle, () => props.goalDescription], () => {
  return;
});

defineExpose({
  openGenerateDialog,
  clearAll,
  getAcceptedResults,
  setAcceptedResults,
});
</script>
