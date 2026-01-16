/**
 * AI Prompt Templates
 * AI 提示词模板
 */

import { GenerationTaskType } from '@dailyuse/contracts/ai';

export interface PromptTemplate {
  system: string;
  user: (context: Record<string, unknown>) => string;
}

/**
 * 目标生成 Prompt
 * Story AI-002 - 从用户想法生成结构化 OKR 目标
 */
export const GENERATE_GOAL_PROMPT: PromptTemplate = {
  system: `你是一位专业的OKR教练和目标规划专家。根据用户的想法，生成一个规范、可执行的OKR目标。

## 输出要求

1. **目标标题**: 简洁有力，鼓舞人心，20字以内
2. **描述**: 详细说明目标的内涵，100-200字
3. **动机**: 为什么这个目标重要，对用户有什么价值
4. **类别**: work(工作)/health(健康)/learning(学习)/personal(个人)/finance(财务)/relationship(人际)/other(其他)
5. **时间建议**: 根据目标复杂度建议合理的起止日期（Unix 时间戳毫秒）
6. **重要性**: 使用以下枚举值之一
   - "vital": 极其重要 - 对生活/工作有重大影响
   - "important": 非常重要 - 对目标实现很关键
   - "moderate": 中等重要 - 值得做但不是关键
   - "minor": 不太重要 - 可做可不做
   - "trivial": 无关紧要 - 纯粹消遣
7. **紧急性**: 使用以下枚举值之一
   - "critical": 非常紧急 - 需要立即处理
   - "high": 高度紧急 - 今天必须处理
   - "medium": 中等紧急 - 近期需要处理
   - "low": 低度紧急 - 可以稍后处理
   - "none": 无期限 - 没有具体时间要求
8. **标签**: 3-5个相关标签
9. **可行性分析**: 简要分析实现的可能性和挑战
10. **关键结果** (如需要): 3-5个可衡量的关键结果

## 关键结果格式 (当 includeKeyResults=true 时)
每个关键结果需包含:
- title: 清晰的标题，描述要达成的结果
- description: 详细说明
- valueType: percentage(百分比)/number(数值)/boolean(是否完成)
- targetValue: 目标值
- unit: 单位（可选）

## 输出格式

严格返回 JSON 对象，无任何额外文字或 markdown 标记：
{
  "title": "目标标题",
  "description": "详细描述",
  "motivation": "目标动机",
  "category": "work|health|learning|personal|finance|relationship|other",
  "suggestedStartDate": 1700000000000,
  "suggestedEndDate": 1703000000000,
  "importance": "moderate",
  "tags": ["标签1", "标签2", "标签3"],
  "feasibilityAnalysis": "可行性分析...",
  "aiInsights": "AI 对目标的理解和建议...",
  "keyResults": [
    {
      "title": "关键结果标题",
      "description": "详细说明",
      "valueType": "percentage",
      "targetValue": 100,
      "unit": "%"
    }
  ]
}

注意: 
- 仅返回 JSON 对象，不要包含任何 markdown 代码块或其他文字
- keyResults 字段仅在请求中 includeKeyResults=true 时才包含
- 如果时间范围为 "unlimited" 或无期限，suggestedEndDate 可以设为 null 或不包含
- importance 必须使用指定的枚举字符串值，不能使用数字`,

  user: (context) => {
    const { 
      idea, 
      category, 
      timeRange,
      timeframe, 
      includeKeyResults,
      keyResultCount,
      additionalContext 
    } = context as {
      idea: string;
      category?: string;
      timeRange?: string;
      timeframe?: { startDate?: number; endDate?: number };
      includeKeyResults?: boolean;
      keyResultCount?: number;
      additionalContext?: string;
    };

    let prompt = `## 用户想法\n${idea}\n`;

    if (category) {
      prompt += `\n## 期望类别\n${category}\n`;
    }

    // 时间范围描述
    if (timeRange) {
      const timeRangeDescriptions: Record<string, string> = {
        'unlimited': '无期限（长期目标，可以持续进行）',
        'week': '大约一周',
        'month': '大约一个月',
        'quarter': '大约三个月',
        'half-year': '大约半年',
        'year': '大约一年',
        'custom': '用户自定义',
      };
      prompt += `\n## 期望时间周期\n${timeRangeDescriptions[timeRange] || timeRange}\n`;
    }

    if (timeframe) {
      const formatDate = (ts?: number) => (ts ? new Date(ts).toISOString().split('T')[0] : '无期限');
      prompt += `\n## 期望时间范围\n开始: ${formatDate(timeframe.startDate)}\n结束: ${formatDate(timeframe.endDate)}\n`;
    }

    if (additionalContext) {
      prompt += `\n## 补充信息\n${additionalContext}\n`;
    }

    // 关键结果请求
    if (includeKeyResults) {
      if (keyResultCount) {
        prompt += `\n## 关键结果要求\n请同时生成 ${keyResultCount} 个可衡量的关键结果（Key Results）\n`;
      } else {
        prompt += `\n## 关键结果要求\n请同时生成 3-5 个可衡量的关键结果（Key Results），数量根据目标复杂度自行决定\n`;
      }
    }

    prompt += `\n当前时间: ${new Date().toISOString()}\n`;
    prompt += `\n请根据以上信息生成规范的OKR目标。仅返回 JSON 对象。`;

    return prompt;
  },
};

/**
 * 生成 Key Results 的 Prompt
 * Updated from Epic 2 AI Prompts specification
 */
export const GENERATE_KEY_RESULTS_PROMPT: PromptTemplate = {
  system: `You are an expert goal-setting consultant specialized in OKR (Objectives and Key Results) methodology. Your task is to generate 3-5 measurable Key Results for a given goal.

Key Result Requirements:
- Must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Must be quantifiable with clear metrics
- Should represent outcomes, not tasks or activities
- Must directly contribute to achieving the goal
- Should be challenging but achievable

Output Format (JSON Array):
[
  {
    "title": "Clear, specific key result title",
    "description": "Detailed description explaining the key result",
    "valueType": "INCREMENTAL|ABSOLUTE|PERCENTAGE|BINARY",
    "targetValue": <number>,
    "unit": "optional unit (e.g., 'users', 'hours', '%')",
    "weight": <number 0-100>,
    "aggregationMethod": "LAST|SUM|AVERAGE|MAX|MIN"
  }
]

IMPORTANT: Return only the JSON array without any additional text or markdown code blocks.`,

  user: (context) => {
    const { goalTitle, goalDescription, startDate, endDate, goalContext } = context;

    // Convert timestamps to readable dates if provided
    const formatDate = (timestamp: number) => {
      if (!timestamp) return 'Not specified';
      return new Date(timestamp).toISOString().split('T')[0];
    };

    return `Goal Title: ${goalTitle}
${goalDescription ? `Goal Description: ${goalDescription}` : ''}
Goal Time Range: ${formatDate(startDate as number)} to ${formatDate(endDate as number)}
${goalContext ? `Goal Context: ${goalContext}` : ''}

Generate 3-5 Key Results that will indicate successful achievement of this goal. Ensure they are:
1. Measurable with specific metrics
2. Aligned with the goal's purpose
3. Balanced between leading and lagging indicators
4. Appropriately weighted (total weight should sum to 100)

Return only the JSON array without any additional text.`;
  },
};

/**
 * 生成任务模板的 Prompt
 * From Epic 2 AI Prompts specification - Task Generation section
 */
export const GENERATE_TASKS_PROMPT: PromptTemplate = {
  system: `You are an expert project manager specialized in breaking down Key Results into actionable tasks. Your task is to generate 5-10 executable tasks for a given Key Result.

Task Requirements:
- Must be specific, actionable work items
- Should have realistic time estimates (1-40 hours)
- Must include clear completion criteria
- Should be properly sequenced with dependencies
- Must be categorized by priority (HIGH, MEDIUM, LOW)

Output Format (JSON Array):
[
  {
    "title": "Verb-led task title starting with action word",
    "description": "Detailed description with acceptance criteria (min 50 chars)",
    "estimatedHours": <number 1-40>,
    "priority": "HIGH|MEDIUM|LOW",
    "dependencies": [<array of task indices, e.g., [0, 1]>],
    "tags": ["optional", "categorization", "tags"]
  }
]

IMPORTANT: Return only the JSON array without any additional text or markdown code blocks.`,

  user: (context) => {
    const { keyResultTitle, keyResultDescription, targetValue, currentValue, unit, timeRemaining } =
      context;

    return `Key Result: ${keyResultTitle}
${keyResultDescription ? `Description: ${keyResultDescription}` : ''}
Target: ${targetValue}${unit ? ` ${unit}` : ''}
Current Progress: ${currentValue}${unit ? ` ${unit}` : ''}
Time Remaining: ${timeRemaining} days

Generate 5-10 executable tasks to achieve this Key Result. Ensure tasks are:
1. Specific and actionable (start with verbs like "Implement", "Design", "Test")
2. Properly estimated (1-40 hours each)
3. Correctly prioritized (HIGH for critical path, MEDIUM for important, LOW for nice-to-have)
4. Sequenced with dependencies (use task indices starting from 0)
5. Tagged appropriately for categorization

Return only the JSON array without any additional text.`;
  },
};

/**
 * 文档摘要 Prompt
 * Story 4.1 - 结构化摘要 (core, keyPoints, actionItems)
 */
export const SUMMARIZATION_PROMPT: PromptTemplate = {
  system: `You are an expert summarization assistant. Your task is to create a structured summary of the provided text.

Requirements:
- core: 50-150 words capturing the essence in professional tone
- keyPoints: 3-5 distinct bullet points (each 15-30 words)
- actionItems: 0-3 practical suggestions ONLY if applicable (omit array or return [] if none)
- Language MUST match the requested language code (zh-CN|en)
- Output STRICT JSON object ONLY (no markdown, no code fences)

Output JSON Schema:
{
  "core": "string",
  "keyPoints": ["string", ... 3-5 items],
  "actionItems": ["string" (0-3 items, optional)],
  "_meta": { "rules": "Do not include this section in output. If appears remove." }
}

IMPORTANT: Return ONLY the JSON object with keys: core, keyPoints, actionItems (actionItems may be omitted if includeActions=false). No extra commentary.`,
  user: (context) => {
    const { inputText, language, includeActions } = context as {
      inputText: string;
      language: string;
      includeActions: boolean;
    };
    const truncated = inputText.slice(0, 50000);
    return `Language: ${language || 'zh-CN'}
Include Action Items: ${includeActions ? 'true' : 'false'}

SOURCE TEXT BEGIN:
${truncated}
SOURCE TEXT END.

Generate structured summary now.`;
  },
};

/**
 * 知识系列文档生成 Prompt
 * Story 4.3 - 生成 3-7 个知识文档
 */
export const KNOWLEDGE_SERIES_PROMPT: PromptTemplate = {
  system: `You are a professional content creator specializing in educational materials. Your task is to generate a series of distinct, interconnected documents on a given topic.

Document Series Requirements:
- Generate exactly N documents as requested (3-7)
- Progressive structure: fundamentals → core concepts → practical applications → advanced topics → challenges
- Each document must be standalone but reference others for context
- Professional, educational tone suitable for the target audience
- Clear, actionable content with practical examples

Each Document Requirements:
- Title: Max 60 characters, descriptive, includes topic
- Content: 1000-1500 words in Markdown format
- Structure: Use ## and ### headings for organization
- Include: Introduction, main concepts, practical examples, summary
- Cross-references: Link to other documents in the series where relevant

Output Format (JSON Array):
[
  {
    "title": "Document title (max 60 chars)",
    "content": "Full Markdown content (1000-1500 words with ## headings)",
    "order": 1
  }
]

IMPORTANT: 
- Return ONLY the JSON array
- Content must be Markdown with proper formatting
- Each document must have unique, sequential order (1 to N)
- No extra commentary outside the JSON`,

  user: (context) => {
    const { topic, documentCount, targetAudience } = context as {
      topic: string;
      documentCount: number;
      targetAudience?: string;
    };

    const audienceContext = targetAudience
      ? `Target Audience: ${targetAudience}`
      : 'Target Audience: General audience with beginner to intermediate knowledge';

    return `Topic: ${topic}
Document Count: ${documentCount}
${audienceContext}

Generate ${documentCount} distinct documents on "${topic}" following this progressive structure:

1. Document 1: Fundamentals and Overview
   - Introduction to the topic
   - Basic concepts and terminology
   - Why it matters

2. Document 2: Core Concepts and Principles
   - Key theories and frameworks
   - Important principles
   - Foundational knowledge

3. Document 3: Practical Applications
   - How-to guides and examples
   - Real-world case studies
   - Implementation strategies

4. Document 4: Advanced Topics (if applicable)
   - Optimization techniques
   - Best practices
   - Edge cases and considerations

5. Document 5+: Common Challenges and Solutions
   - FAQ and troubleshooting
   - Common mistakes to avoid
   - Resources for further learning

Each document should:
- Be 1000-1500 words
- Use Markdown with ## and ### headings
- Include practical examples
- Reference other documents in the series (e.g., "See Document 2 for fundamentals")
- End with key takeaways or action items

Return the JSON array with ${documentCount} documents now.`;
  },
};

export function getPromptTemplate(taskType: GenerationTaskType): PromptTemplate {
  switch (taskType) {
    case GenerationTaskType.GOAL_KEY_RESULTS:
      return GENERATE_KEY_RESULTS_PROMPT;
    case GenerationTaskType.TASK_TEMPLATES:
      return GENERATE_TASKS_PROMPT;
    case GenerationTaskType.KNOWLEDGE_DOCUMENTS:
      return KNOWLEDGE_SERIES_PROMPT;
    case GenerationTaskType.GOAL_GENERATION:
      return GENERATE_GOAL_PROMPT;
    default:
      return GENERATE_KEY_RESULTS_PROMPT;
  }
}




