/**
 * useDocumentSummarizer Composable
 * 文档摘要功能的状态管理和业务逻辑
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 */

import { ref, computed } from 'vue';
import { aiApplicationService as documentSummarizerApplicationService } from '@dailyuse/ai/application-client';
import type { SummaryResult } from '../types/summarization';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

export function useDocumentSummarizer() {
  // ============ State ============
  const inputText = ref<string>('');
  const summary = ref<SummaryResult | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const includeActions = ref<boolean>(true);
  const language = ref<'zh-CN' | 'en'>('zh-CN');

  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ============ Computed ============
  const characterCount = computed(() => inputText.value.length);
  const isTextValid = computed(() => characterCount.value >= 1 && characterCount.value <= 50000);
  const canSummarize = computed(() => isTextValid.value && !isLoading.value);

  // ============ Methods ============

  /**
   * 调用摘要 API
   */
  async function summarize(): Promise<void> {
    if (!canSummarize.value) {
      return;
    }

    // 清除之前的错误和结果
    error.value = null;
    summary.value = null;
    isLoading.value = true;

    try {
      const response = await documentSummarizerApplicationService.summarize({
        text: inputText.value,
        language: language.value,
        includeActions: includeActions.value,
      });

      summary.value = response;
      showSuccess('摘要生成成功');
    } catch (err: any) {
      error.value = mapErrorToMessage(err);
      showError(error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 将摘要复制到剪贴板
   */
  async function copyToClipboard(): Promise<void> {
    if (!summary.value) {
      showError('没有可复制的摘要');
      return;
    }

    try {
      const formattedText = formatSummaryForClipboard(summary.value);
      await navigator.clipboard.writeText(formattedText);
      showSuccess('摘要已复制到剪贴板');
    } catch (err: any) {
      showError('复制失败，请手动复制');
    }
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    inputText.value = '';
    summary.value = null;
    error.value = null;
    isLoading.value = false;
  }

  // ============ Helper Functions ============

  /**
   * 格式化摘要为纯文本（用于剪贴板）
   */
  function formatSummaryForClipboard(result: SummaryResult): string {
    const lines: string[] = [];

    // Core Summary
    lines.push('核心摘要：');
    lines.push(result.summary.core);
    lines.push('');

    // Key Points
    lines.push('关键要点：');
    result.summary.keyPoints.forEach((point, index) => {
      lines.push(`${index + 1}. ${point}`);
    });
    lines.push('');

    // Action Items (if present)
    if (result.summary.actionItems && result.summary.actionItems.length > 0) {
      lines.push('行动建议：');
      result.summary.actionItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item}`);
      });
      lines.push('');
    }

    // Metadata
    lines.push('---');
    lines.push(`使用 Token: ${result.metadata.tokensUsed}`);
    lines.push(`压缩率: ${(result.metadata.compressionRatio * 100).toFixed(1)}%`);
    lines.push(`原文长度: ${result.metadata.inputLength} 字符`);

    return lines.join('\n');
  }

  /**
   * 将 API 错误映射为用户友好的消息
   */
  function mapErrorToMessage(err: any): string {
    const status = err?.response?.status || err?.status;

    switch (status) {
      case 401:
        return '请先登录以使用此功能';
      case 429:
        return '今日配额已用完，请明天再试';
      case 504:
        return '请求超时，请尝试使用更短的文本';
      case 400:
        return '输入无效，文本长度必须在 1-50,000 字符之间';
      case 500:
        return '服务暂时不可用，请稍后再试';
      default:
        return err?.response?.data?.message || err?.message || '摘要生成失败，请重试';
    }
  }

  return {
    // State
    inputText,
    summary,
    isLoading,
    error,
    includeActions,
    language,

    // Computed
    characterCount,
    isTextValid,
    canSummarize,

    // Methods
    summarize,
    copyToClipboard,
    reset,
  };
}
