/**
 * OpenAI AI 服务提供商实现
 * @module @dailyuse/infrastructure-client/ai/providers
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { IAIService, AIServiceConfig } from '@dailyuse/contracts/ai';
import type {
  DecompositionResult,
  DecompositionRequest,
} from '@dailyuse/contracts/goal';
import {
  TASK_DECOMPOSITION_SYSTEM_PROMPT,
  TASK_DECOMPOSITION_USER_PROMPT_TEMPLATE,
  TIME_ESTIMATION_PROMPT,
  PRIORITY_SUGGESTION_PROMPT,
} from '../prompts/decomposition';

// 定义 Zod schema 用于 AI 结构化输出
const DecomposedTaskSchema = z.object({
  title: z.string().describe('任务标题'),
  description: z.string().describe('任务描述'),
  estimatedMinutes: z.number().describe('预估分钟数'),
  complexity: z.enum(['simple', 'medium', 'complex']).describe('复杂度'),
  dependencies: z.array(z.string()).describe('依赖的任务标题'),
  suggestedOrder: z.number().describe('建议的执行顺序'),
});

const DecompositionResultSchema = z.object({
  tasks: z.array(DecomposedTaskSchema).describe('分解的任务列表'),
  timeline: z.object({
    totalEstimatedHours: z.number().describe('总预估小时数'),
    estimatedDays: z.number().optional().describe('预估天数'),
  }).describe('时间线信息'),
  risks: z.array(
    z.object({
      description: z.string().describe('风险描述'),
      mitigation: z.string().describe('缓解方案'),
    })
  ).describe('识别的风险'),
  confidence: z.number().optional().describe('置信度 0-1'),
});

const TimeEstimateSchema = z.object({
  estimatedMinutes: z.number().describe('预估分钟数'),
  confidence: z.number().describe('置信度'),
  reasoning: z.string().optional().describe('理由'),
});

const PrioritySuggestionSchema = z.object({
  priorities: z.array(
    z.object({
      title: z.string().describe('任务标题'),
      priority: z.number().describe('优先级分数 1-10'),
      reasoning: z.string().optional().describe('理由'),
    })
  ).describe('优先级列表'),
  overallStrategy: z.string().optional().describe('整体建议'),
});

/**
 * OpenAI AI 服务实现
 * 使用 AI SDK 和 structured output 获取结构化的 JSON 响应
 */
export class OpenAIProvider implements IAIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.config = {
      model: 'gpt-4-turbo',
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 60000,
      ...config,
    };
  }

  /**
   * 将目标分解为子任务
   */
  async decomposeGoal(request: DecompositionRequest): Promise<DecompositionResult> {
    try {
      const userPrompt = TASK_DECOMPOSITION_USER_PROMPT_TEMPLATE(
        request.goalTitle,
        request.goalDescription,
        request.goalDeadline,
        request.existingTasks?.map((t: any) => t.title),
        request.userContext
      );

      const result = await generateObject({
        model: openai(this.config.model || 'gpt-4-turbo'),
        system: TASK_DECOMPOSITION_SYSTEM_PROMPT,
        prompt: userPrompt,
        schema: DecompositionResultSchema,
        temperature: this.config.temperature || 0.7,
      } as any);

      return result.object as unknown as DecompositionResult;
    } catch (error) {
      throw new Error(
        `Failed to decompose goal: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 估计任务耗时
   */
  async estimateTaskTime(
    taskDescription: string
  ): Promise<{ estimatedMinutes: number; confidence: number; reasoning?: string }> {
    try {
      const result = await generateObject({
        model: openai(this.config.model || 'gpt-4-turbo'),
        prompt: TIME_ESTIMATION_PROMPT(taskDescription),
        schema: TimeEstimateSchema,
        temperature: 0.3, // 更低的温度以获得更一致的估计
      } as any);

      return {
        estimatedMinutes: (result.object as any).estimatedMinutes,
        confidence: (result.object as any).confidence,
        reasoning: (result.object as any).reasoning,
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate task time: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 建议任务优先级
   */
  async suggestPriority(
    tasks: Array<{ title: string; description: string }>
  ): Promise<{
    priorities: Array<{ title: string; priority: number }>;
    reasoning: string;
  }> {
    try {
      const result = await generateObject({
        model: openai(this.config.model || 'gpt-4-turbo'),
        prompt: PRIORITY_SUGGESTION_PROMPT(tasks),
        schema: PrioritySuggestionSchema,
        temperature: 0.5,
      } as any);

      return {
        priorities: ((result.object as any).priorities || []).map((p: any) => ({
          title: p.title,
          priority: p.priority,
        })),
        reasoning: (result.object as any).overallStrategy || 'Based on urgency, importance, and dependencies',
      };
    } catch (error) {
      throw new Error(
        `Failed to suggest priorities: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 检查服务可用性
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 简单的测试调用
      const result = await generateObject({
        model: openai(this.config.model || 'gpt-4-turbo'),
        prompt: 'Respond with {"status": "ok"}',
        schema: z.object({ status: z.string() }),
      } as any);
      return (result.object as any).status === 'ok';
    } catch {
      return false;
    }
  }
}
