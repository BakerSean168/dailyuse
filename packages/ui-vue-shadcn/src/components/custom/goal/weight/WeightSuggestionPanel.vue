<template>
  <v-dialog v-model="isOpen" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary">
        <v-icon class="mr-2">mdi-robot</v-icon>
        AI 权重推荐
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-subtitle class="pt-3">
        基于 KeyResult 内容分析，为您推荐以下 3 种权重分配策略
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- 策略卡片 -->
        <v-row v-else>
          <v-col v-for="strategy in strategies" :key="strategy.name" cols="12" md="4">
            <v-card
              :class="['strategy-card', { selected: selectedStrategy === strategy.name }]"
              :color="selectedStrategy === strategy.name ? 'primary' : undefined"
              :variant="selectedStrategy === strategy.name ? 'tonal' : 'outlined'"
              @click="selectedStrategy = strategy.name"
            >
              <v-card-title class="d-flex align-center">
                {{ strategy.label }}
                <v-spacer />
                <v-chip
                  size="small"
                  :color="getConfidenceColor(strategy.confidence)"
                  variant="flat"
                >
                  {{ strategy.confidence }}% 匹配
                </v-chip>
              </v-card-title>

              <v-card-subtitle class="text-caption">
                {{ strategy.description }}
              </v-card-subtitle>

              <v-card-text>
                <!-- 权重可视化 -->
                <div class="weight-visualization mb-3">
                  <div
                    v-for="(weight, index) in strategy.weights"
                    :key="index"
                    class="weight-bar-container mb-2"
                  >
                    <div class="d-flex align-center mb-1">
                      <span class="text-caption text-medium-emphasis" style="min-width: 40px">
                        KR {{ index + 1 }}
                      </span>
                      <v-progress-linear
                        :model-value="weight"
                        :color="getWeightColor(weight)"
                        height="20"
                        class="mx-2"
                      >
                        <template #default>
                          <strong class="text-caption">{{ weight }}%</strong>
                        </template>
                      </v-progress-linear>
                    </div>
                  </div>
                </div>

                <!-- 推荐理由 -->
                <v-alert type="info" variant="tonal" density="compact" class="text-caption">
                  <v-icon size="small" class="mr-1">mdi-lightbulb-outline</v-icon>
                  {{ strategy.reasoning }}
                </v-alert>
              </v-card-text>

              <v-card-actions>
                <v-btn
                  block
                  :color="selectedStrategy === strategy.name ? 'primary' : undefined"
                  :variant="selectedStrategy === strategy.name ? 'flat' : 'tonal'"
                  @click.stop="selectAndApply(strategy)"
                >
                  <v-icon start>mdi-check</v-icon>
                  应用此策略
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- KeyResults 预览 -->
        <v-card v-if="keyResults.length > 0" variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" size="small">mdi-format-list-bulleted</v-icon>
            KeyResults 列表
          </v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="(kr, index) in keyResults"
              :key="kr.id"
              :title="`${index + 1}. ${kr.title}`"
              :subtitle="getKeywordHighlight(kr.title)"
            >
              <template #prepend>
                <v-icon :color="getWeightColor(kr.weight || 0)"> mdi-circle </v-icon>
              </template>
              <template #append>
                <v-chip size="small" variant="text"> 当前: {{ kr.weight || 0 }}% </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!selectedStrategy"
          @click="confirmSelection"
        >
          确认选择
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { KeyResultClientDTO } from '@dailyuse/contracts/goal';
import {
  weightRecommendationService,
  type WeightStrategy,
} from '../../../application/services/WeightRecommendationService';

const props = defineProps<{
  keyResults: KeyResultClientDTO[];
}>();

const emit = defineEmits<{
  apply: [strategy: WeightStrategy];
  close: [];
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const selectedStrategy = ref<string | null>(null);
const strategies = ref<WeightStrategy[]>([]);

// 生成推荐策略
function generateRecommendations() {
  isLoading.value = true;

  try {
    strategies.value = weightRecommendationService.recommendWeights(props.keyResults);

    // 默认选中置信度最高的策略
    if (strategies.value.length > 0) {
      const bestStrategy = strategies.value.reduce((best, current) =>
        current.confidence > best.confidence ? current : best,
      );
      selectedStrategy.value = bestStrategy.name;
    }
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
  } finally {
    isLoading.value = false;
  }
}

// 获取置信度颜色
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'warning';
  return 'info';
}

// 获取权重颜色
function getWeightColor(weight: number): string {
  if (weight >= 40) return 'success';
  if (weight >= 20) return 'warning';
  return 'error';
}

// 高亮关键词
function getKeywordHighlight(title: string): string {
  const keywords = [
    'critical',
    'urgent',
    'important',
    'key',
    'revenue',
    'customer',
    '关键',
    '核心',
    '重要',
    '紧急',
    '收入',
    '客户',
  ];

  const foundKeywords = keywords.filter((kw) => title.toLowerCase().includes(kw.toLowerCase()));

  return foundKeywords.length > 0
    ? `包含关键词: ${foundKeywords.slice(0, 3).join(', ')}`
    : '未检测到特殊关键词';
}

// 选择并应用策略
function selectAndApply(strategy: WeightStrategy) {
  selectedStrategy.value = strategy.name;
  confirmSelection();
}

// 确认选择
function confirmSelection() {
  if (!selectedStrategy.value) return;

  const strategy = strategies.value.find((s) => s.name === selectedStrategy.value);

  if (strategy) {
    emit('apply', strategy);
    close();
  }
}

// 打开对话框
function open() {
  if (props.keyResults.length === 0) {
    console.warn('No KeyResults to analyze');
    return;
  }

  isOpen.value = true;
  generateRecommendations();
}

// 关闭对话框
function close() {
  isOpen.value = false;
  selectedStrategy.value = null;
  emit('close');
}

defineExpose({ open, close });
</script>

<style scoped>
.strategy-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.strategy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.strategy-card.selected {
  border: 2px solid rgb(var(--v-theme-primary));
}

.weight-visualization {
  min-height: 120px;
}

.weight-bar-container {
  position: relative;
}
</style>
