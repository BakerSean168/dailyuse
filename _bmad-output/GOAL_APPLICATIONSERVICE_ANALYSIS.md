# Goal ApplicationService 架构分析

**分析日期**: 2026-01-18  
**目录**: `/workspaces/dailyuse/apps/web/src/modules/goal/application/services/`

---

## 📊 执行总结

### 关键发现

| 项目                 | 状态       | 备注                                                |
| -------------------- | ---------- | --------------------------------------------------- |
| **总服务文件**       | 14 个      | 分布在 services/ 目录                               |
| **Store 依赖**       | ❌ 仅 1 个 | GoalSyncApplicationService 专有                     |
| **架构规范**         | ✅ 良好    | 大多数遵循 Pattern A（无 Store 依赖）               |
| **Composables 放置** | ⚠️ 问题    | 2 个 Composables 在 application/ 应在 presentation/ |
| **事件驱动**         | ✅ 采用    | KeyResult/GoalRecord/GoalReview 使用 eventBus       |

---

## 🔍 详细服务分析

### 1. GoalManagementApplicationService

**文件**: [GoalManagementApplicationService.ts](GoalManagementApplicationService.ts#L1-L243)

#### 公开异步方法清单

| 方法名                   | 返回类型                               | 行号 |
| ------------------------ | -------------------------------------- | ---- |
| `createGoal()`           | `Promise<Goal>`                        | L58  |
| `getGoals()`             | `Promise<{goals: Goal[]; pagination}>` | L66  |
| `getGoalById()`          | `Promise<Goal>`                        | L105 |
| `updateGoal()`           | `Promise<Goal>`                        | L123 |
| `deleteGoal()`           | `Promise<void>`                        | L131 |
| `activateGoal()`         | `Promise<Goal>`                        | L141 |
| `pauseGoal()`            | `Promise<Goal>`                        | L150 |
| `completeGoal()`         | `Promise<Goal>`                        | L159 |
| `archiveGoal()`          | `Promise<Goal>`                        | L168 |
| `searchGoals()`          | `Promise<{goals: Goal[]; pagination}>` | L176 |
| `getGoalAggregateView()` | `Promise<{goal: Goal; rawResponse}>`   | L207 |
| `cloneGoal()`            | `Promise<Goal>`                        | L224 |

#### Store 依赖

- **使用 Store**: ❌ **否**
- **说明**: 完全无 Store 依赖，遵循 Pattern A
- **职责**: 仅负责 API 调用 + DTO → Entity 转换
- **设计注释**: L13-24 详细说明架构原则

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**

- Service 返回数据给调用方，Store 操作由 Composable 层负责
- 错误直接抛出，由 Composable 统一处理
- 完全独立测试能力

---

### 2. GoalSyncApplicationService ⭐ 特殊服务

**文件**: [GoalSyncApplicationService.ts](GoalSyncApplicationService.ts#L1-L212)

#### 公开异步方法清单

| 方法名                       | 返回类型                              | 行号 |
| ---------------------------- | ------------------------------------- | ---- |
| `initializeEventListeners()` | `void`                                | L51  |
| `handleGoalRefreshEvent()`   | `Promise<void>` (私有)                | L79  |
| `cleanup()`                  | `void`                                | L113 |
| `syncAllGoalsAndFolders()`   | `Promise<{goalsCount; foldersCount}>` | L138 |
| `refreshAll()`               | `Promise<void>`                       | L198 |

#### Store 依赖

- **使用 Store**: ✅ **是**
- **Store 类型**: `getGoalStore()`
- **导入位置**: [L26](GoalSyncApplicationService.ts#L26)
- **使用位置**: [L48 (getter方法)](GoalSyncApplicationService.ts#L48), [L108-L111 (setGoals/setGoalFolders)](GoalSyncApplicationService.ts#L108-L111)
- **说明**: 这是唯一允许直接 Store 依赖的服务

#### 方法详情

**initializeEventListeners() - L51**

```typescript
// 监听 Goal 聚合根刷新事件
// 从 eventBus 接收: GoalEvents.AGGREGATE_REFRESH
// 触发: handleGoalRefreshEvent()
```

**syncAllGoalsAndFolders() - L138**

- 并行获取所有 Goal 和 GoalFolder 数据
- 转换为客户端实体
- 批量写入 Store
- 返回计数信息

**handleGoalRefreshEvent() - L79**

- 监听来自其他 ApplicationService 的事件
- 从服务器刷新对应 Goal 完整数据
- 更新 Store

#### 职责设计（L23-29）

```
核心职责：
1. 初始化时同步所有数据
2. 监听事件总线上的 Goal 刷新事件
3. 当事件触发时，从服务器刷新对应的 Goal 数据
4. 更新 Pinia store

事件驱动架构：
- KeyResult/GoalRecord 更新 → 发布 GoalAggregateRefreshEvent
- GoalSyncApplicationService 监听此事件
- 自动从服务器刷新 Goal 数据
- Store 更新 → UI 自动响应
```

#### 分析

✅ **架构规范**  
这是特殊的同步服务，设计上需要直接操作 Store（L20-21的注释说明）。这与其他 Service 完全不同：

- **一般 Service**: API → Entity → Composable → Store
- **GoalSyncApplicationService**: 直接操作 Store（事件驱动）

---

### 3. KeyResultApplicationService

**文件**: [KeyResultApplicationService.ts](KeyResultApplicationService.ts#L1-L176)

#### 公开异步方法清单

| 方法名                          | 返回类型                                         | 行号 |
| ------------------------------- | ------------------------------------------------ | ---- |
| `createKeyResultForGoal()`      | `Promise<KeyResultClientDTO>`                    | L49  |
| `getKeyResultsByGoal()`         | `Promise<KeyResultsResponse>`                    | L67  |
| `updateKeyResultForGoal()`      | `Promise<KeyResultClientDTO>`                    | L75  |
| `deleteKeyResultForGoal()`      | `Promise<void>`                                  | L93  |
| `batchUpdateKeyResultWeights()` | `Promise<KeyResultsResponse>`                    | L103 |
| `getProgressBreakdown()`        | `Promise<ProgressBreakdown>`                     | L127 |
| `generateKeyResults()`          | `Promise<{keyResults; tokenUsage; generatedAt}>` | L137 |

#### Store 依赖

- **使用 Store**: ❌ **否**
- **说明**: 完全无 Store 依赖

#### 事件驱动

- **发布事件**: ✅ **是** - `GoalEvents.AGGREGATE_REFRESH`
- **事件发布位置**:
  - [L59](KeyResultApplicationService.ts#L59) - 创建 KeyResult 后
  - [L87](KeyResultApplicationService.ts#L87) - 更新 KeyResult 后
  - [L99](KeyResultApplicationService.ts#L99) - 删除 KeyResult 后
  - [L117](KeyResultApplicationService.ts#L117) - 批量更新权重后

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**  
完全遵循事件驱动模式。创建/更新/删除 KeyResult 时发布事件，让 GoalSyncApplicationService 自动刷新 Goal 数据。

---

### 4. GoalRecordApplicationService

**文件**: [GoalRecordApplicationService.ts](GoalRecordApplicationService.ts#L1-L121)

#### 公开异步方法清单

| 方法名                        | 返回类型                       | 行号 |
| ----------------------------- | ------------------------------ | ---- |
| `createGoalRecord()`          | `Promise<GoalRecordClientDTO>` | L47  |
| `getGoalRecordsByKeyResult()` | `Promise<GoalRecordsResponse>` | L70  |
| `getGoalRecordsByGoal()`      | `Promise<GoalRecordsResponse>` | L88  |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### 事件驱动

- **发布事件**: ✅ **是** - `GoalEvents.AGGREGATE_REFRESH`
- **事件发布位置**: [L63](GoalRecordApplicationService.ts#L63)
- **说明**: 创建 Record 会触发服务器端进度计算，必需刷新 Goal

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**  
与 KeyResultApplicationService 类似，完全事件驱动。

---

### 5. GoalReviewApplicationService

**文件**: [GoalReviewApplicationService.ts](GoalReviewApplicationService.ts#L1-L103)

#### 公开异步方法清单

| 方法名                   | 返回类型                       | 行号 |
| ------------------------ | ------------------------------ | ---- |
| `createGoalReview()`     | `Promise<GoalReviewClientDTO>` | L37  |
| `getGoalReviewsByGoal()` | `Promise<GoalReviewsResponse>` | L59  |
| `updateGoalReview()`     | `Promise<GoalReviewClientDTO>` | L66  |
| `deleteGoalReview()`     | `Promise<void>`                | L85  |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### 事件驱动

- **发布事件**: ✅ **是** - `GoalEvents.AGGREGATE_REFRESH`
- **事件发布位置**: [L48](GoalReviewApplicationService.ts#L48), [L77](GoalReviewApplicationService.ts#L77), [L95](GoalReviewApplicationService.ts#L95)

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**  
完全遵循事件驱动模式。

---

### 6. GoalFolderApplicationService

**文件**: [GoalFolderApplicationService.ts](GoalFolderApplicationService.ts#L1-L77)

#### 公开异步方法清单

| 方法名               | 返回类型                | 行号 |
| -------------------- | ----------------------- | ---- |
| `createGoalFolder()` | `Promise<GoalFolder>`   | L41  |
| `getGoalFolders()`   | `Promise<GoalFolder[]>` | L51  |
| `updateGoalFolder()` | `Promise<GoalFolder>`   | L65  |
| `deleteGoalFolder()` | `Promise<void>`         | L73  |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**

---

### 7. FocusModeApplicationService

**文件**: [FocusModeApplicationService.ts](FocusModeApplicationService.ts#L1-L108)

#### 公开异步方法清单

| 方法名                  | 返回类型                              | 行号 |
| ----------------------- | ------------------------------------- | ---- |
| `activateFocusMode()`   | `Promise<FocusModeClientDTO>`         | L43  |
| `deactivateFocusMode()` | `Promise<FocusModeClientDTO>`         | L57  |
| `extendFocusMode()`     | `Promise<FocusModeClientDTO>`         | L70  |
| `getActiveFocusMode()`  | `Promise<FocusModeClientDTO \| null>` | L88  |
| `getFocusModeHistory()` | `Promise<FocusModeClientDTO[]>`       | L101 |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**

---

### 8. WeightSnapshotWebApplicationService

**文件**: [WeightSnapshotWebApplicationService.ts](WeightSnapshotWebApplicationService.ts#L1-L153)

#### 公开异步方法清单

| 方法名               | 返回类型                           | 行号 |
| -------------------- | ---------------------------------- | ---- |
| `updateKRWeight()`   | `Promise<{keyResult; weightInfo}>` | L36  |
| `getGoalSnapshots()` | `Promise<{snapshots; pagination}>` | L75  |
| `getKRSnapshots()`   | `Promise<{snapshots; pagination}>` | L91  |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### 事件驱动

- **发布事件**: ✅ **是** - `WEIGHT_UPDATED` (跨平台事件总线)
- **事件发布位置**: [L57](WeightSnapshotWebApplicationService.ts#L57)

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**  
特点：使用 CrossPlatformEventBus（不是 GoalEvents.AGGREGATE_REFRESH）

---

### 9. StatusRuleEngine

**文件**: [StatusRuleEngine.ts](StatusRuleEngine.ts#L1-L269)

#### 特点

- **非 ApplicationService**: 是一个业务引擎
- **目的**: 评估 Goal 状态转换规则
- **公开方法**: `evaluate()`, `getAllRules()`, `enableRule()`, `disableRule()`
- **无异步方法**

#### 分析

ℹ️ **特殊用途**  
这是一个规则评估引擎，不涉及 API 调用。

---

### 10. TemplateRecommendationService

**文件**: [TemplateRecommendationService.ts](TemplateRecommendationService.ts#L1-L225)

#### 公开方法清单

| 方法名                      | 返回类型                          | 行号 |
| --------------------------- | --------------------------------- | ---- |
| `getAllTemplates()`         | `GoalTemplate[]`                  | L42  |
| `recommendTemplates()`      | `RecommendationResult[]`          | L49  |
| `getSmartRecommendations()` | `Promise<RecommendationResult[]>` | L175 |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### Composables 使用

- **无 Composables 使用**

#### 分析

✅ **架构规范**

---

### 11. WeightRecommendationService

**文件**: [WeightRecommendationService.ts](WeightRecommendationService.ts#L1-L341)

#### 特点

- **基于规则引擎**: 分析 KeyResult 标题生成权重建议
- **不涉及 API 调用**: 纯业务逻辑
- **公开方法**: 权重分配策略推荐

#### 分析

ℹ️ **特殊用途**

---

### 12. DAGExportService

**文件**: [DAGExportService.ts](DAGExportService.ts#L1-L153)

#### 公开异步方法清单

| 方法名        | 返回类型        | 行号   |
| ------------- | --------------- | ------ |
| `exportPNG()` | `Promise<Blob>` | L22    |
| `exportSVG()` | `Promise<Blob>` | L38    |
| `exportPDF()` | `Promise<Blob>` | (待查) |

#### Store 依赖

- **使用 Store**: ❌ **否**

#### 分析

✅ **架构规范**

---

### 13. GoalTimelineService

**文件**: [GoalTimelineService.ts](GoalTimelineService.ts#L1-L292)

#### 特点

- **时间线服务**: 处理目标历史快照
- **支持权重快照**: 基于权重快照的时间线动画
- **不涉及 API 调用**: 本地数据处理

#### 分析

ℹ️ **特殊用途**

---

### 14. DAGPerformanceOptimization

**文件**: [DAGPerformanceOptimization.ts](DAGPerformanceOptimization.ts#L1-L311)

#### 特点

- **性能优化模块**: 针对大规模目标图的渲染优化
- **不涉及 API 调用**: 纯性能优化逻辑
- **内容**: 配置、LOD、视口裁剪等

#### 分析

ℹ️ **配置模块**

---

## 🎯 Composables 架构问题分析

### ⚠️ 问题发现：Composables 放置错误

**当前状态**:

```
/apps/web/src/modules/goal/application/composables/
├── useAutoStatusRules.ts      ❌ 应在 presentation/
└── useWeightSnapshot.ts       ❌ 应在 presentation/
```

**正确位置应该是**:

```
/apps/web/src/modules/goal/presentation/composables/
├── useAutoStatusRules.ts      ✅
└── useWeightSnapshot.ts       ✅
```

### useAutoStatusRules.ts 分析

**文件**: [useAutoStatusRules.ts](useAutoStatusRules.ts#L1-L187)

- **位置**: 错误地放在 `application/composables/`
- **功能**: Composable 函数，绑定 UI 状态管理
- **依赖**: `statusRuleEngine` (来自 services/)
- **导出**: `useAutoStatusRules()` Composable

### useWeightSnapshot.ts 分析

**文件**: [useWeightSnapshot.ts](useWeightSnapshot.ts#L1-L511)

- **位置**: 错误地放在 `application/composables/`
- **功能**: Composable 函数，权重快照管理
- **依赖**: `weightSnapshotWebApplicationService` (来自 services/)
- **导出**: `useWeightSnapshot()` Composable
- **功能**:
  - 权重更新与快照创建
  - Goal 和 KeyResult 的快照历史查询
  - 权重趋势数据（用于 ECharts 图表）
  - 权重对比分析

---

## 📋 完整服务清单

### 按类型分类

#### ApplicationService（API集成）

1. ✅ GoalManagementApplicationService
2. ✅ GoalSyncApplicationService (特殊：直接操作Store)
3. ✅ KeyResultApplicationService
4. ✅ GoalRecordApplicationService
5. ✅ GoalReviewApplicationService
6. ✅ GoalFolderApplicationService
7. ✅ FocusModeApplicationService
8. ✅ WeightSnapshotWebApplicationService

#### Engine/Service（业务逻辑）

9. ℹ️ StatusRuleEngine
10. ℹ️ TemplateRecommendationService
11. ℹ️ WeightRecommendationService

#### Utility Service（工具）

12. ℹ️ DAGExportService
13. ℹ️ GoalTimelineService
14. ℹ️ DAGPerformanceOptimization

#### Composables（❌ 位置错误）

- ❌ useAutoStatusRules.ts (应在 presentation/)
- ❌ useWeightSnapshot.ts (应在 presentation/)

---

## 🏗️ 架构模式分析

### Pattern A - 标准模式（13个服务）

```
ApplicationService:
  ├─ API 调用 (goalApiClient)
  ├─ DTO → Entity 转换
  └─ 返回数据给 Composable
       │
       ▼
Composable:
  ├─ 处理加载/错误状态
  ├─ 操作 Store
  └─ 调用 UI 更新
       │
       ▼
Store (Pinia):
  ├─ 存储状态
  └─ 暴露 setter/getter
```

**采用者**:

- GoalManagementApplicationService
- KeyResultApplicationService
- GoalRecordApplicationService
- GoalReviewApplicationService
- GoalFolderApplicationService
- FocusModeApplicationService
- WeightSnapshotWebApplicationService
- - 其他

### Pattern B - 事件驱动同步（1个服务）

```
KeyResult/Record/Review 变更:
  ├─ 发布 GoalAggregateRefreshEvent 事件
       │
       ▼
GoalSyncApplicationService:
  ├─ 监听事件
  ├─ 从服务器刷新 Goal 数据
  └─ 直接更新 Store ⭐
```

**采用者**:

- GoalSyncApplicationService (唯一)

---

## 🎯 关键检查清单

### Store 依赖

| 服务                                | 使用 Store | Store 类型       | 行号     |
| ----------------------------------- | ---------- | ---------------- | -------- |
| GoalManagementApplicationService    | ❌         | -                | -        |
| KeyResultApplicationService         | ❌         | -                | -        |
| GoalRecordApplicationService        | ❌         | -                | -        |
| GoalReviewApplicationService        | ❌         | -                | -        |
| GoalFolderApplicationService        | ❌         | -                | -        |
| FocusModeApplicationService         | ❌         | -                | -        |
| WeightSnapshotWebApplicationService | ❌         | -                | -        |
| **GoalSyncApplicationService**      | ✅         | `getGoalStore()` | L26, L48 |
| 其他非API服务                       | ❌         | -                | -        |

### 事件驱动

| 服务                                | 发布事件 | 事件类型                     |
| ----------------------------------- | -------- | ---------------------------- |
| KeyResultApplicationService         | ✅       | GoalEvents.AGGREGATE_REFRESH |
| GoalRecordApplicationService        | ✅       | GoalEvents.AGGREGATE_REFRESH |
| GoalReviewApplicationService        | ✅       | GoalEvents.AGGREGATE_REFRESH |
| WeightSnapshotWebApplicationService | ✅       | WEIGHT_UPDATED               |
| 其他                                | ❌       | -                            |

### Composables 问题

| Composable         | 当前位置                 | 正确位置                  | 状态    |
| ------------------ | ------------------------ | ------------------------- | ------- |
| useAutoStatusRules | application/composables/ | presentation/composables/ | ❌ 错误 |
| useWeightSnapshot  | application/composables/ | presentation/composables/ | ❌ 错误 |

---

## 📊 GoalSyncApplicationService 深度分析

### 为什么需要直接操作 Store？

```
场景：用户在 KeyResultDetail 更新了一个 KeyResult 的权重

1. KeyResultApplicationService.updateKeyResultForGoal()
   - 调用 API 更新 KeyResult
   - 返回更新后的 KeyResultClientDTO ✅
   - 发布 GoalAggregateRefreshEvent 事件 ✅

2. GoalSyncApplicationService 监听事件
   - 立即从服务器刷新 Goal 完整数据
   - 包括所有 KeyResults（权重已更新）
   - 直接写入 Store（不能等 Composable）✅
   - 原因：需要确保其他页面看到最新数据

3. 其他 Composable 观察 Store 变化
   - goalStore.goals 已自动更新 ✅
   - UI 响应式更新 ✅
```

### 流程图

```
KeyResultDetail Component
         │
         ▼ 用户编辑权重
Composable: useKeyResult
         │
         ▼ 调用 Service
KeyResultApplicationService.updateKeyResultForGoal()
         │
         ├─ API 调用: updateKeyResultForGoal(goalUuid, krUuid, {weight: 8})
         │
         ├─ 返回: KeyResultClientDTO
         │
         ├─ 发布事件: GoalAggregateRefreshEvent
         │     {
         │       goalUuid: 'xxx',
         │       reason: 'key-result-updated',
         │       timestamp: Date.now(),
         │       metadata: { keyResultUuid: 'yyy' }
         │     }
         │
         ▼ 事件总线
GoalSyncApplicationService 监听
         │
         ├─ 接收事件
         │
         ├─ API 调用: getGoalById(goalUuid, true)
         │     确保包含所有 KeyResults
         │
         ├─ 返回: GoalClientDTO (完整包括所有更新)
         │
         ├─ 转换: Goal.fromClientDTO()
         │
         ├─ **直接更新 Store**: goalStore.addOrUpdateGoal(goal)
         │     ⭐ 这是关键！必须直接更新
         │
         ▼ 所有使用 goalStore 的 Composable
观察到 Store 变化
         │
         ▼
UI 自动响应式更新
```

### 为什么不能通过 Composable 更新？

❌ **错误做法**:

```typescript
// KeyResultApplicationService.updateKeyResultForGoal()
async updateKeyResultForGoal(...) {
  const data = await goalApiClient.updateKeyResultForGoal(...);

  // ❌ 错误：不能直接操作 Store
  // 原因1: 会形成循环依赖（Service → Composable → Store → Service）
  // 原因2: 如果 Composable 没有监听这个事件，数据不会更新
  // 原因3: 其他页面无法感知更新

  this.goalStore.addOrUpdateGoal(...);  // ❌ 不允许
  return data;
}
```

✅ **正确做法**:

```typescript
// KeyResultApplicationService.updateKeyResultForGoal()
async updateKeyResultForGoal(...) {
  const data = await goalApiClient.updateKeyResultForGoal(...);

  // ✅ 发布事件
  this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {
    keyResultUuid: keyResultUuid,
  });

  // ✅ 返回数据
  return data;
}

// 事件监听 → GoalSyncApplicationService.handleGoalRefreshEvent()
private async handleGoalRefreshEvent(event: GoalAggregateRefreshEvent) {
  // ✅ 只在这里直接操作 Store
  const goal = Goal.fromClientDTO(goalDto);
  this.goalStore.addOrUpdateGoal(goal);  // ✅ 允许
}
```

---

## 🔧 建议改进

### 1. ⚠️ 高优先级 - 修复 Composables 位置

**现状**: Composables 错误地放在 `application/composables/`

**行动**:

1. 创建 `presentation/composables/` 目录（如果不存在）
2. 移动文件：
   - `application/composables/useAutoStatusRules.ts` → `presentation/composables/useAutoStatusRules.ts`
   - `application/composables/useWeightSnapshot.ts` → `presentation/composables/useWeightSnapshot.ts`
3. 更新所有导入路径

### 2. ✅ 良好实践 - 继续遵循事件驱动模式

**当前状态**: ✅ 很好

**建议**:

- 保持 KeyResultApplicationService、GoalRecordApplicationService、GoalReviewApplicationService 的事件发布
- 确保所有影响 Goal 聚合根的操作都发布事件

### 3. ✅ 文档 - 保留架构注释

**当前状态**: ✅ 很好

**建议**:

- 保留每个 Service 顶部的架构说明
- 特别是 GoalSyncApplicationService 的说明（L20-29）非常详细

### 4. 📋 测试覆盖

**建议**:

- 为 GoalSyncApplicationService 的事件处理编写单元测试
- 验证事件驱动链的正确性

---

## 📁 目录结构建议

```
/apps/web/src/modules/goal/
├── application/
│   ├── composables/          ← ❌ 这里的 Composables 应该移走
│   │   ├── useAutoStatusRules.ts
│   │   └── useWeightSnapshot.ts
│   ├── services/
│   │   ├── GoalManagementApplicationService.ts
│   │   ├── GoalSyncApplicationService.ts
│   │   ├── KeyResultApplicationService.ts
│   │   ├── GoalRecordApplicationService.ts
│   │   ├── GoalReviewApplicationService.ts
│   │   ├── GoalFolderApplicationService.ts
│   │   ├── FocusModeApplicationService.ts
│   │   ├── WeightSnapshotWebApplicationService.ts
│   │   ├── StatusRuleEngine.ts
│   │   ├── TemplateRecommendationService.ts
│   │   ├── WeightRecommendationService.ts
│   │   ├── DAGExportService.ts
│   │   ├── GoalTimelineService.ts
│   │   ├── DAGPerformanceOptimization.ts
│   │   └── index.ts
│   ├── rules/
│   ├── templates/
│   ├── events/
│   └── index.ts
├── presentation/
│   ├── composables/           ← ✅ Composables 应该在这里
│   │   ├── useAutoStatusRules.ts
│   │   └── useWeightSnapshot.ts
│   ├── stores/
│   ├── components/
│   ├── views/
│   └── widgets/
├── infrastructure/
└── index.ts
```

---

## 🎓 结论

### 架构评分

| 维度               | 评分 | 状态                          |
| ------------------ | ---- | ----------------------------- |
| **Store 依赖隔离** | 9/10 | ✅ 优秀（仅 1 个例外）        |
| **事件驱动模式**   | 8/10 | ✅ 良好（部分服务采用）       |
| **代码组织**       | 7/10 | ⚠️ 可改进（Composables 位置） |
| **文档完整性**     | 9/10 | ✅ 优秀                       |
| **可测试性**       | 8/10 | ✅ 良好                       |

### 总体评价

✅ **整体架构规范且健康**

- 大多数 ApplicationService 遵循 Pattern A（无 Store 依赖）
- GoalSyncApplicationService 的设计合理（事件驱动）
- 错误处理由 axios 拦截器和 Composable 层统一处理
- 主要问题是 Composables 放置位置错误

### 优先改进项

1. **立即修复** ⚠️: 移动 Composables 到 `presentation/composables/`
2. **保持** ✅: 事件驱动模式的使用
3. **继续** ✅: 详细的架构文档

---

## 📎 附录

### 相关文件位置参考

- **Service 导出**: [services/index.ts](services/index.ts)
- **Store 定义**: [presentation/stores/goalStore.ts](../presentation/stores/goalStore.ts)
- **事件定义**: [@dailyuse/contracts/goal](../../../packages/contracts/goal/)
- **API 客户端**: [infrastructure/api/goalApiClient.ts](../infrastructure/api/goalApiClient.ts)

### 事件驱动相关代码

**发布事件示例**（KeyResultApplicationService L55-62）:

```typescript
// 发布事件通知 Goal 需要刷新
const event: GoalAggregateRefreshEvent = {
  goalUuid,
  reason: 'key-result-created',
  timestamp: Date.now(),
  metadata: { keyResultUuid: data.uuid },
};
eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
```

**监听事件示例**（GoalSyncApplicationService L51-69）:

```typescript
initializeEventListeners(): void {
  const handler = (event: GoalAggregateRefreshEvent) =>
    this.handleGoalRefreshEvent(event);

  eventBus.on(GoalEvents.AGGREGATE_REFRESH, handler);

  const unsubscribe = () =>
    eventBus.off(GoalEvents.AGGREGATE_REFRESH, handler);

  this.unsubscribeFunctions.set(GoalEvents.AGGREGATE_REFRESH, unsubscribe);
}
```
