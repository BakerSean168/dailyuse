/**
 * useAIGeneration Composable
 * AI 生成功能组合式 API
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 *
 * 使用示例：
 * ```vue
 * <script setup>
 * import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
 *
 * const { generateKeyResults, isGenerating, error, quota } = useAIGeneration();
 *
 * async function handleGenerate() {
 *   const result = await generateKeyResults({
 *     goalTitle: '学习 Vue 3',
 *     goalDescription: '深入掌握 Vue 3 Composition API'
 *   });
 *   console.log(result.keyResults);
 * }
 * </script>
 * ```
 */

import { computed } from 'vue';
import { useAIGenerationStore } from '@/stores/ai/aiGenerationStore';
import { AIGenerateKeyResults, GetQuota } from '@dailyuse/application-client/ai';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * AI Generation Composable
 */
export function useAIGeneration() {
  const store = useAIGenerationStore();
  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ============ Computed Properties ============

  /**
   * 是否正在生成
   */
  const isGenerating = computed(() => store.isGenerating);

  /**
   * 是否正在加载配额
   */
  const isLoadingQuota = computed(() => store.isLoadingQuota);

  /**
   * 错误信息
   */
  const error = computed(() => store.error);

  /**
   * 配额状态
   */
  const quota = computed(() => store.quota);

  /**
   * 最近的关键结果
   */
  const recentKeyResults = computed(() => store.recentKeyResults);

  /**
   * 是否有剩余配额
   */
  const hasQuota = computed(() => store.hasQuota);

  /**
   * 配额使用百分比
   */
  const quotaUsagePercentage = computed(() => store.quotaUsagePercentage);

  /**
   * 距离下次重置的时间
   */
  const timeToReset = computed(() => store.timeToReset);

  /**
   * 配额状态描述
   */
  const quotaStatusText = computed(() => store.quotaStatusText);

  // ============ Methods ============

  /**
   * 生成关键结果
   * Epic 2 API: Uses startDate/endDate instead of category/importance/urgency
   */
  async function generateKeyResults(params: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      // 调用 Goal 模块的 ApplicationService (DDD架构)
      const result = await new AIGenerateKeyResults().execute(params);

      // 更新 Store (Note: Epic 2 API returns tokenUsage/generatedAt instead of quota/taskUuid)
      store.addKeyResults(result.keyResults, result.generatedAt.toString());

      showSuccess(`已生成 ${result.keyResults.length} 个关键结果`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate key results';
      store.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 生成任务模板
   */
  async function generateTaskTemplate(params: {
    krTitle: string;
    krDescription?: string;
    targetValue?: number;
    unit?: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      const result = await aiGenerationApplicationService.generateTaskTemplate(params);

      showSuccess('任务模板生成成功');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate task template';
      store.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 生成任务列表
   * Story 2.4: Generate Task Templates UI
   */
  async function generateTasks(params: {
    keyResultTitle: string;
    keyResultDescription?: string;
    targetValue: number;
    currentValue: number;
    unit?: string;
    timeRemaining: number;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      const result = await aiGenerationApplicationService.generateTasks(params);

      showSuccess(`已生成 ${result.tasks.length} 个任务`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate tasks';
      store.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 生成知识文档
   */
  async function generateKnowledgeDocument(params: {
    topic: string;
    context?: string;
    templateType: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      const result = await aiGenerationApplicationService.generateKnowledgeDocument(params);

      showSuccess('知识文档生成成功');
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate knowledge document';
      store.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 获取配额状态
   */
  async function loadQuotaStatus() {
    try {
      store.setLoadingQuota(true);
      store.clearError();

      const quotaData = await new GetQuota().execute();
      store.setQuota(quotaData);

      return quotaData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota status';
      store.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      store.setLoadingQuota(false);
    }
  }

  /**
   * 清除错误
   */
  function clearError() {
    store.clearError();
  }

  /**
   * 清除结果
   */
  function clearResults() {
    store.clearResults();
  }

  /**
   * 重置所有状态
   */
  function reset() {
    store.reset();
  }

  // ============ Return ============

  return {
    // Computed
    isGenerating,
    isLoadingQuota,
    error,
    quota,
    recentKeyResults,
    hasQuota,
    quotaUsagePercentage,
    timeToReset,
    quotaStatusText,

    // Methods
    generateKeyResults,
    generateTaskTemplate,
    generateTasks,
    generateKnowledgeDocument,
    loadQuotaStatus,
    clearError,
    clearResults,
    reset,
  };
}
