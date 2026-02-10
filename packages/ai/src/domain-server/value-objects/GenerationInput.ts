/**
 * GenerationInput Value Object - Server
 * 生成输入值对象 - 服务端
 */

import type {
  GenerationInputServerDTO,
  GenerationInputPersistenceDTO,
  GenerationTaskType,
} from '@dailyuse/contracts/ai';

/**
 * GenerationInput 值对象 - 服务端
 * 封装 AI 生成任务的输入参数
 */
export class GenerationInput {
  private constructor(
    public readonly prompt: string,
    public readonly systemPrompt: string | null,
    public readonly taskType: GenerationTaskType,
    public readonly temperature: number | null,
    public readonly maxTokens: number | null,
    public readonly contextData: Record<string, unknown> | null
  ) {}

  /**
   * 创建 GenerationInput 实例
   */
  public static create(props: {
    prompt: string;
    systemPrompt?: string | null;
    taskType: GenerationTaskType;
    temperature?: number | null;
    maxTokens?: number | null;
    contextData?: Record<string, unknown> | null;
  }): GenerationInput {
    return new GenerationInput(
      props.prompt,
      props.systemPrompt ?? null,
      props.taskType,
      props.temperature ?? null,
      props.maxTokens ?? null,
      props.contextData ?? null
    );
  }

  /**
   * 从 Server DTO 创建
   */
  public static fromDTO(dto: GenerationInputServerDTO): GenerationInput {
    return new GenerationInput(
      dto.prompt,
      dto.systemPrompt,
      dto.taskType,
      dto.temperature,
      dto.maxTokens,
      dto.contextData
    );
  }

  /**
   * 从持久化 DTO 创建
   */
  public static fromPersistence(
    dto: GenerationInputPersistenceDTO
  ): GenerationInput {
    return new GenerationInput(
      dto.prompt,
      dto.systemPrompt,
      dto.taskType,
      dto.temperature,
      dto.maxTokens,
      dto.contextData ? JSON.parse(dto.contextData) : null
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toDTO(): GenerationInputServerDTO {
    return {
      prompt: this.prompt,
      systemPrompt: this.systemPrompt,
      taskType: this.taskType,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      contextData: this.contextData,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistence(): GenerationInputPersistenceDTO {
    return {
      prompt: this.prompt,
      systemPrompt: this.systemPrompt,
      taskType: this.taskType,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      contextData: this.contextData ? JSON.stringify(this.contextData) : null,
    };
  }

  /**
   * 设置 prompt（不可变操作）
   */
  public withPrompt(prompt: string): GenerationInput {
    return new GenerationInput(
      prompt,
      this.systemPrompt,
      this.taskType,
      this.temperature,
      this.maxTokens,
      this.contextData
    );
  }

  /**
   * 设置 system prompt（不可变操作）
   */
  public withSystemPrompt(systemPrompt: string | null): GenerationInput {
    return new GenerationInput(
      this.prompt,
      systemPrompt,
      this.taskType,
      this.temperature,
      this.maxTokens,
      this.contextData
    );
  }

  /**
   * 设置温度参数（不可变操作）
   */
  public withTemperature(temperature: number | null): GenerationInput {
    return new GenerationInput(
      this.prompt,
      this.systemPrompt,
      this.taskType,
      temperature,
      this.maxTokens,
      this.contextData
    );
  }

  /**
   * 设置最大 tokens（不可变操作）
   */
  public withMaxTokens(maxTokens: number | null): GenerationInput {
    return new GenerationInput(
      this.prompt,
      this.systemPrompt,
      this.taskType,
      this.temperature,
      maxTokens,
      this.contextData
    );
  }
}
