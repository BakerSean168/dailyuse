/**
 * useAIGeneration Hook
 *
 * AI 生成能力 Hook
 */

import { useState, useCallback } from 'react';
import { aiApplicationService } from '../../application/services';
import type {
  GenerateGoalRequest,
  GenerateGoalWithKRsRequest,
} from '@dailyuse/contracts/ai';

// Local type aliases for consistency with hook interface
type GenerateGoalInput = GenerateGoalRequest;
type GenerateGoalWithKeyResultsInput = GenerateGoalWithKRsRequest;

// 使用推断类型
type GenerateGoalResult = Awaited<ReturnType<typeof aiApplicationService.generateGoal>>;
type GenerateGoalWithKRsResult = Awaited<ReturnType<typeof aiApplicationService.generateGoalWithKeyResults>>;
type GenerateKeyResultsResult = Awaited<ReturnType<typeof aiApplicationService.generateKeyResults>>;

export interface AIGenerationState {
  generating: boolean;
  streamingContent: string;
  error: string | null;
}

export interface UseAIGenerationReturn extends AIGenerationState {
  generateGoal: (input: GenerateGoalInput) => Promise<GenerateGoalResult>;
  generateGoalWithKeyResults: (input: GenerateGoalWithKeyResultsInput) => Promise<GenerateGoalWithKRsResult>;
  generateKeyResults: (goalDescription: string) => Promise<GenerateKeyResultsResult>;
  streamChat: (
    conversationUuid: string,
    message: string,
    onChunk?: (content: string) => void
  ) => Promise<string>;
  clearStreamingContent: () => void;
}

/**
 * AI 生成能力 Hook
 */
export function useAIGeneration(): UseAIGenerationReturn {
  const [state, setState] = useState<AIGenerationState>({
    generating: false,
    streamingContent: '',
    error: null,
  });

  /**
   * 生成目标
   */
  const generateGoal = useCallback(async (input: GenerateGoalInput) => {
    setState(prev => ({ ...prev, generating: true, error: null }));
    try {
      const goal = await aiApplicationService.generateGoal(input);
      setState(prev => ({ ...prev, generating: false }));
      return goal;
    } catch (error) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: error instanceof Error ? error.message : '生成目标失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 生成目标和关键结果
   */
  const generateGoalWithKeyResults = useCallback(async (
    input: GenerateGoalWithKeyResultsInput
  ) => {
    setState(prev => ({ ...prev, generating: true, error: null }));
    try {
      const result = await aiApplicationService.generateGoalWithKeyResults(input);
      setState(prev => ({ ...prev, generating: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: error instanceof Error ? error.message : '生成目标和关键结果失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 生成关键结果
   */
  const generateKeyResults = useCallback(async (goalDescription: string) => {
    setState(prev => ({ ...prev, generating: true, error: null }));
    try {
      const keyResults = await aiApplicationService.generateKeyResults(goalDescription);
      setState(prev => ({ ...prev, generating: false }));
      return keyResults;
    } catch (error) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: error instanceof Error ? error.message : '生成关键结果失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 流式聊天
   */
  const streamChat = useCallback(async (
    conversationUuid: string,
    message: string,
    onChunk?: (content: string) => void
  ): Promise<string> => {
    setState(prev => ({ ...prev, generating: true, streamingContent: '', error: null }));
    try {
      let fullContent = '';
      const stream = aiApplicationService.streamChat({
        conversationUuid,
        message,
      });

      for await (const chunk of stream) {
        const content = chunk.delta || '';
        fullContent += content;
        setState(prev => ({ ...prev, streamingContent: fullContent }));
        onChunk?.(content);
      }

      setState(prev => ({ ...prev, generating: false }));
      return fullContent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: error instanceof Error ? error.message : '流式聊天失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 清空流式内容
   */
  const clearStreamingContent = useCallback(() => {
    setState(prev => ({ ...prev, streamingContent: '' }));
  }, []);

  return {
    ...state,
    generateGoal,
    generateGoalWithKeyResults,
    generateKeyResults,
    streamChat,
    clearStreamingContent,
  };
}
