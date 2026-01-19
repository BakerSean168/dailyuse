/**
 * useGoalGeneration Composable
 * AI 目标生成 Composable
 *
 * 职责：
 * - 从用户想法生成 OKR 目标
 * - 管理生成状态和结果
 */

import { ref, type Ref, type ComputedRef } from 'vue';
import { GenerateGoal } from '@dailyuse/application-client/ai';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';
import type { GeneratedGoalDraft } from '@dailyuse/contracts/ai';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface UseGoalGenerationReturn {
  loading: Ref<boolean>;
  error: Ref<string | null>;
  generatedGoal: Ref<GeneratedGoalDraft | null>;
  tokenUsage: Ref<TokenUsage | null>;
  providerUsed: Ref<string | null>;
  modelUsed: Ref<string | null>;
  generateGoal: (params: {
    idea: string;
    context?: string;
    providerUuid?: string;
    category?: string;
  }) => Promise<GeneratedGoalDraft | null>;
  reset: () => void;
}

/**
 * Goal Generation Composable
 */
export function useGoalGeneration(): UseGoalGenerationReturn {
  const { success: showSuccess, error: showError } = getGlobalMessage();
  // ===== 状态 =====
  const loading = ref(false);
  const error: Ref<string | null> = ref(null);
  const generatedGoal: Ref<GeneratedGoalDraft | null> = ref(null);
  const tokenUsage: Ref<TokenUsage | null> = ref(null);
  const providerUsed: Ref<string | null> = ref(null);
  const modelUsed: Ref<string | null> = ref(null);

  /**
   * 从想法生成目标
   */
  async function generateGoal(params: {
    idea: string;
    context?: string;
    providerUuid?: string;
    category?: string;
  }): Promise<GeneratedGoalDraft | null> {
    loading.value = true;
    error.value = null;
    generatedGoal.value = null;

    try {
      const response = await new GenerateGoal().execute(params.idea, {
        context: params.context,
        providerUuid: params.providerUuid,
        category: params.category as any,
      });

      generatedGoal.value = response.goal;
      tokenUsage.value = response.tokenUsage;
      providerUsed.value = response.providerUsed;
      modelUsed.value = response.modelUsed;

      showSuccess('目标生成成功');
      return response.goal;
    } catch (err: any) {
      const errorMsg = err.message || '生成目标失败';
      error.value = errorMsg;
      showError(errorMsg);
      console.error('Failed to generate goal:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    loading.value = false;
    error.value = null;
    generatedGoal.value = null;
    tokenUsage.value = null;
    providerUsed.value = null;
    modelUsed.value = null;
  }

  return {
    // 状态
    loading,
    error,
    generatedGoal,
    tokenUsage,
    providerUsed,
    modelUsed,

    // 方法
    generateGoal,
    reset,
  };
}
