/**
 * OpenAI AI 服务提供商实�?
 * @module @/infrastructure-client/providers
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { IAIService, AIServiceConfig, DecompositionResult, DecompositionRequest } from '../../application-client/interfaces/IAIService';
import {
  TASK_DECOMPOSITION_SYSTEM_PROMPT,
  TASK_DECOMPOSITION_USER_PROMPT_TEMPLATE,
  TIME_ESTIMATION_PROMPT,
  PRIORITY_SUGGESTION_PROMPT,
} from '../prompts/decomposition';

// Zod schemas for AI structured output
const DecomposedTaskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().describe('Task description'),
  estimatedMinutes: z.number().describe('Estimated minutes'),
  complexity: z.enum(['simple', 'medium', 'complex']).describe('Complexity level'),
  dependencies: z.array(z.string()).describe('Dependent task titles'),
  suggestedOrder: z.number().describe('Suggested execution order'),
});

const DecompositionResultSchema = z.object({
  tasks: z.array(DecomposedTaskSchema).describe('Decomposed tasks list'),
  timeline: z.object({
    totalEstimatedHours: z.number().describe('Total estimated hours'),
    estimatedDays: z.number().optional().describe('Estimated days'),
  }).describe('Timeline info'),
  risks: z.array(
    z.object({
      description: z.string().describe('Risk description'),
      mitigation: z.string().describe('Mitigation strategy'),
    })
  ).describe('Identified risks'),
  confidence: z.number().optional().describe('Confidence score 0-1'),
});

const TimeEstimateSchema = z.object({
  estimatedMinutes: z.number().describe('Estimated minutes'),
  confidence: z.number().describe('Confidence score'),
  reasoning: z.string().optional().describe('Reasoning'),
});

const PrioritySuggestionSchema = z.object({
  priorities: z.array(
    z.object({
      title: z.string().describe('Task title'),
      priority: z.number().describe('Priority score 1-10'),
      reasoning: z.string().optional().describe('Reasoning'),
    })
  ).describe('Priority list'),
  overallStrategy: z.string().optional().describe('Overall strategy'),
});

/**
 * OpenAI AI 服务实现
 * 使用 AI SDK �?structured output 获取结构化的 JSON 响应
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
   * 将目标分解为子任�?
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
   * 建议任务优先�?
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
   * 检查服务可用�?
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
