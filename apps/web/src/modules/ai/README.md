# AI 生成功能模块

## 📋 概述

AI 生成功能模块为 DailyUse 应用提供 AI 智能生成能力，当前支持：

- ✅ **关键结果生成**：基于目标信息生成可量化的关键结果
- 🚧 **任务模板生成**：（规划中）
- 🚧 **知识文档生成**：（规划中）

---

## 🏗️ 架构设计

### 分层架构

```
apps/web/src/modules/ai/
├── api/                          # API 层
│   └── aiGenerationApiClient.ts  # HTTP 客户端
├── composables/                  # 组合式 API
│   └── useAIGeneration.ts        # 业务逻辑封装
└── stores/                       # 状态管理
    └── aiGenerationStore.ts      # Pinia 存储

apps/web/src/modules/goal/presentation/components/
├── AIGenerateKRButton.vue        # AI 生成按钮组件
├── KRPreviewList.vue             # 关键结果预览列表
└── AIKeyResultsSection.vue       # 整合组件
```

### 数据流

```
用户操作 → AIGenerateKRButton
         ↓
    useAIGeneration (Composable)
         ↓
    aiGenerationApiClient (HTTP)
         ↓
    Backend API (/api/ai/generate/key-results)
         ↓
    AIGenerationApplicationService
         ↓
    AIGenerationService + OpenAI API
         ↓
    返回生成结果 → 更新 Store → 更新 UI
```

---

## 🚀 快速开始

### 1. 基础用法（独立按钮）

在任何 Vue 组件中使用 AI 生成按钮：

```vue
<template>
  <AIGenerateKRButton
    :initial-goal-title="goalTitle"
    :initial-goal-description="goalDescription"
    @generated="handleGenerated"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import AIGenerateKRButton from '@/modules/goal/presentation/components/AIGenerateKRButton.vue';

const goalTitle = ref('提升团队工作效率');
const goalDescription = ref('通过优化流程和工具...');

function handleGenerated(result: any) {
  console.log('生成结果:', result);
  // result.keyResults: 生成的关键结果数组
  // result.quota: 更新后的配额信息
}

function handleError(error: string) {
  console.error('生成失败:', error);
}
</script>
```

### 2. 完整用法（含预览和采纳）

使用整合组件，包含生成、预览、编辑、采纳功能：

```vue
<template>
  <AIKeyResultsSection
    ref="aiSectionRef"
    :goal-title="goalTitle"
    :goal-description="goalDescription"
    @results-updated="handleResultsUpdated"
    @manual-add="handleManualAdd"
  />
</template>

<script setup lang="ts">
import AIKeyResultsSection from '@/modules/goal/presentation/components/AIKeyResultsSection.vue';

const aiSectionRef = ref();
const goalTitle = ref('提升团队工作效率');
const goalDescription = ref('通过优化流程和工具提升效率...');

function handleResultsUpdated(results: any[]) {
  console.log('已采纳的关键结果:', results);
  // 处理已采纳的结果
}

function handleManualAdd() {
  console.log('用户点击手动添加');
  // 打开手动添加对话框
}

// 程序化调用
function triggerGeneration() {
  aiSectionRef.value?.openGenerateDialog();
}

function getResults() {
  return aiSectionRef.value?.getAcceptedResults();
}
</script>
```

### 3. 使用 Composable（自定义 UI）

直接使用 `useAIGeneration` composable 构建自定义 UI：

```vue
<script setup lang="ts">
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';

const {
  // 状态
  isGenerating,
  error,
  quota,
  hasQuota,
  quotaUsagePercentage,
  timeToReset,
  quotaStatusText,
  recentKeyResults,

  // 方法
  generateKeyResults,
  loadQuotaStatus,
  clearError,
  clearResults,
  reset,
} = useAIGeneration();

async function generate() {
  try {
    const result = await generateKeyResults({
      goalTitle: '提升团队效率',
      goalDescription: '...',
      category: 'work',
      importance: 'high',
      urgency: 'urgent',
    });

    console.log('生成成功:', result);
  } catch (err) {
    console.error('生成失败:', err);
  }
}
</script>

<template>
  <div>
    <v-btn @click="generate" :loading="isGenerating" :disabled="!hasQuota">
      生成关键结果 ({{ quotaStatusText }})
    </v-btn>

    <v-alert v-if="error" type="error">{{ error }}</v-alert>

    <div v-for="kr in recentKeyResults" :key="kr.uuid">
      {{ kr.title }}
    </div>
  </div>
</template>
```

---

## 📦 组件 API

### AIGenerateKRButton.vue

**Props:**

```typescript
interface Props {
  initialGoalTitle?: string; // 初始目标标题
  initialGoalDescription?: string; // 初始目标描述
}
```

**Emits:**

```typescript
{
  generated: [result: any];  // 生成成功
  error: [error: string];    // 生成失败
}
```

**Methods (Expose):**

```typescript
{
  openDialog(): void;   // 打开生成对话框
  closeDialog(): void;  // 关闭对话框
}
```

---

### KRPreviewList.vue

**Props:**

```typescript
interface Props {
  results?: any[]; // 生成的关键结果数组
}
```

**Emits:**

```typescript
{
  accept: [results: KeyResultPreview[]];               // 采纳选中的结果
  remove: [index: number];                             // 移除某个结果
  edit: [index: number, kr: KeyResultPreview];         // 编辑某个结果
  selectionChange: [selectedResults: KeyResultPreview[]]; // 选择变更
}
```

**Methods (Expose):**

```typescript
{
  loadResults(results: any[]): void;  // 加载结果
  selectAll(): void;                  // 全选
  deselectAll(): void;                // 全不选
  clearAll(): void;                   // 清空列表
}
```

---

### AIKeyResultsSection.vue

**Props:**

```typescript
interface Props {
  goalTitle?: string; // 目标标题
  goalDescription?: string; // 目标描述
}
```

**Emits:**

```typescript
{
  resultsUpdated: [results: KeyResultData[]];  // 已采纳结果更新
  manualAdd: [];                               // 点击手动添加
}
```

**Methods (Expose):**

```typescript
{
  openGenerateDialog(): void;                    // 打开生成对话框
  clearAll(): void;                              // 清空所有结果
  getAcceptedResults(): KeyResultData[];         // 获取已采纳结果
  setAcceptedResults(results: KeyResultData[]): void; // 设置已采纳结果
}
```

---

## 🔌 Composable API

### useAIGeneration()

**返回值:**

```typescript
{
  // ===== 状态 (Computed) =====
  isGenerating: ComputedRef<boolean>;           // 是否正在生成
  error: ComputedRef<string | null>;            // 错误信息
  quota: ComputedRef<AIUsageQuotaClientDTO | null>; // 配额信息
  hasQuota: ComputedRef<boolean>;               // 是否有剩余额度
  quotaUsagePercentage: ComputedRef<number>;    // 额度使用百分比
  timeToReset: ComputedRef<string | null>;      // 重置倒计时
  quotaStatusText: ComputedRef<string>;         // 配额状态文本
  recentKeyResults: ComputedRef<any[]>;         // 最近生成的结果

  // ===== 方法 =====
  generateKeyResults(params: {
    goalTitle: string;
    goalDescription?: string;
    category?: string;
    importance?: string;
    urgency?: string;
  }): Promise<any>;                             // 生成关键结果

  generateTaskTemplate(): Promise<any>;         // 生成任务模板（未实现）
  generateKnowledgeDocument(): Promise<any>;    // 生成知识文档（未实现）

  loadQuotaStatus(): Promise<void>;             // 加载配额状态
  clearError(): void;                           // 清空错误
  clearResults(): void;                         // 清空结果
  reset(): void;                                // 重置状态
}
```

---

## 📊 配额管理

### 配额规则

- **默认配额**: 50 次/天
- **重置周期**: DAILY（每日 00:00 重置）
- **超额行为**: 拒绝请求，返回错误

### 配额状态

```typescript
interface AIUsageQuotaClientDTO {
  uuid: string;
  accountUuid: string;
  quotaLimit: number; // 配额上限（50）
  currentUsage: number; // 当前使用量
  remainingQuota: number; // 剩余额度
  resetPeriod: 'DAILY'; // 重置周期
  lastResetAt: string; // 上次重置时间
  nextResetAt: string; // 下次重置时间
}
```

### 检查配额

```typescript
const { quota, hasQuota, quotaUsagePercentage, timeToReset } = useAIGeneration();

console.log('剩余额度:', quota.value?.remainingQuota);
console.log('是否可用:', hasQuota.value);
console.log('使用率:', quotaUsagePercentage.value + '%');
console.log('重置倒计时:', timeToReset.value); // "5小时30分钟"
```

---

## 🧪 测试

### 单元测试

```bash
# 测试 Composable
pnpm nx test web --testFile=useAIGeneration.spec.ts

# 测试组件
pnpm nx test web --testFile=AIGenerateKRButton.spec.ts
pnpm nx test web --testFile=KRPreviewList.spec.ts
```

### E2E 测试

```typescript
// cypress/e2e/ai-generation.cy.ts
describe('AI 生成关键结果', () => {
  it('应该成功生成关键结果', () => {
    cy.visit('/goals/new');
    cy.get('[data-testid="ai-generate-kr-button"]').click();
    cy.get('[data-testid="goal-title-input"]').type('提升效率');
    cy.get('[data-testid="generate-button"]').click();
    cy.get('[data-testid="kr-preview-list"]').should('be.visible');
  });
});
```

---

## 🔧 配置

### 环境变量

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

### OpenAI 配置（后端）

```bash
# .env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

---

## 🐛 故障排查

### 问题 1: 生成失败 "配额不足"

**原因**: 今日配额已用完  
**解决**: 等待明日 00:00 重置，或联系管理员增加配额

### 问题 2: 生成失败 "未登录"

**原因**: 未获取到 accountUuid  
**解决**: 确保已登录，检查 `useAuthenticationStore` 状态

### 问题 3: 生成结果格式错误

**原因**: 后端 OpenAI 返回格式不符合预期  
**解决**: 检查 `AIGenerationService.generateKeyResults()` 的 Prompt

### 问题 4: UI 组件不显示

**原因**: 未正确导入或注册组件  
**解决**: 检查 import 路径和组件注册

---

## 📚 相关文档

- [Story AI-001 - 生成关键结果](../../../docs/stories/story-AI-001.md)
- [AI 模块架构设计](../../../docs/architecture-ai.md)
- [OpenAI Adapter 实现](../../../packages/domain-server/src/ai/adapters/OpenAIAdapter.ts)
- [API 路由配置](../../../apps/api/src/modules/ai/interface/http/routes.ts)

---

## 🎯 下一步

- [ ] 实现任务模板生成功能
- [ ] 实现知识文档生成功能
- [ ] 添加生成历史记录
- [ ] 添加自定义 Prompt 功能
- [ ] 优化生成质量和速度

---

**维护者**: DailyUse Team  
**最后更新**: 2025-11-10
