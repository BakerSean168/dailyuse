# ApplicationServices 模块分析报告

## 概览

分析 4 个核心模块的 ApplicationServices，涵盖提醒、任务、AI 和设置功能。

---

## 1️⃣ 提醒模块 (Reminder Module)

**路径:** `/workspaces/dailyuse/apps/web/src/modules/reminder/application/services/`

### 📊 基本信息

| 项目                 | 内容                                                 |
| -------------------- | ---------------------------------------------------- |
| **Services 数量**    | 4 个                                                 |
| **总方法数**         | 25+ 个 async 方法                                    |
| **Store 依赖**       | ✅ Yes - `useReminderStore()` / `getReminderStore()` |
| **Composables 需求** | ✅ Yes - 错误处理和 UI 反馈                          |
| **模式**             | Pattern A (ApplicationService 负责 API + DTO 转换)   |
| **优先级**           | **High**                                             |

### 📝 Services 列表

#### 1. **ReminderGroupApplicationService**

- **职责:** 提醒分组 CRUD 操作
- **Public Methods:**
  - `createReminderGroup()` - 创建分组
  - `getReminderGroups()` - 获取分组列表（支持分页）
  - `getReminderGroup()` - 获取分组详情
  - `updateReminderGroup()` - 更新分组
  - `deleteReminderGroup()` - 删除分组
  - `toggleReminderGroupStatus()` - 切换分组启用状态
  - `toggleReminderGroupControlMode()` - 切换分组控制模式

- **Store 调用:**
  - `setLoading()`, `setError()`, `addOrUpdateReminderGroup()`, `setReminderGroups()`, `removeReminderGroup()`
- **设计特点:**
  - 单例模式
  - 懒加载 Store（避免 Pinia 初始化问题）
  - 错误处理统一

#### 2. **ReminderTemplateApplicationService**

- **职责:** 提醒模板 CRUD 操作
- **Public Methods:**
  - `createReminderTemplate()` - 创建模板
  - `getReminderTemplates()` - 获取模板列表（支持缓存优先策略）
  - `getReminderTemplate()` - 获取模板详情
  - `updateReminderTemplate()` - 更新模板
  - `deleteReminderTemplate()` - 删除模板
  - `toggleTemplateEnabled()` - 切换模板启用状态
  - `searchTemplates()` - 搜索模板
  - `moveTemplateToGroup()` - 移动模板到分组
  - `getUpcomingReminders()` - 获取即将到来的提醒

- **Store 调用:**
  - `setLoading()`, `setError()`, `setReminderTemplates()`, `addOrUpdateReminderTemplate()`, `removeReminderTemplate()`

- **设计特点:**
  - 缓存优先策略
  - 支持分组管理
  - 即将到来提醒查询

#### 3. **ReminderStatisticsApplicationService**

- **职责:** 提醒统计数据查询
- **Public Methods:**
  - `getReminderStatistics()` - 获取提醒统计数据

- **Store 调用:**
  - `setLoading()`, `setError()`, `setStatistics()`

- **设计特点:**
  - 单一职责
  - 统计数据缓存管理

#### 4. **ReminderSyncApplicationService**

- **职责:** 提醒数据同步和事件驱动
- **Public Methods:**
  - `initializeEventListeners()` - 初始化事件监听
  - `syncAllTemplatesAndGroups()` - 同步所有数据到 Store
  - `refreshAll()` - 刷新所有数据

- **Private Methods:**
  - `handleTemplateRefreshEvent()` - 处理模板刷新事件
  - `handleGroupRefreshEvent()` - 处理分组刷新事件
  - `refreshAllTemplates()` - 刷新所有模板
  - `refreshAllGroups()` - 刷新所有分组
  - `cleanup()` - 清理事件监听

- **事件驱动:**
  - `ReminderEvents.TEMPLATE_REFRESH`
  - `ReminderEvents.GROUP_REFRESH`
  - `ReminderEvents.TEMPLATES_REFRESH_ALL`
  - `ReminderEvents.GROUPS_REFRESH_ALL`

- **设计特点:**
  - 使用 EventBus 进行事件驱动同步
  - 自动刷新 Store 数据
  - SSE 事件集成

### 🔗 Store 依赖分析

```typescript
// 使用模式
import { getReminderStore } from '../../presentation/stores/reminderStore';
import { useReminderStore } from '../../presentation/stores/reminderStore';

private get reminderStore() {
  return getReminderStore(); // 或 useReminderStore()
}

// Store 方法调用
reminderStore.setLoading(true);
reminderStore.setError(null);
reminderStore.setReminderTemplates(templates);
reminderStore.addOrUpdateReminderTemplate(template);
reminderStore.removeReminderTemplate(uuid);
```

### ⚠️ 关键问题

1. **混用两种 Store 获取方式**
   - `ReminderGroupApplicationService` 使用 `getReminderStore()`
   - `ReminderTemplateApplicationService` 使用 `useReminderStore()`
   - 应该统一使用一种方式

2. **错误处理在 Service 层**
   - 设置 error 到 Store，但 UI 反馈应该由 Composable 处理
   - 违反了 Pattern A 的设计原则

3. **事件驱动需要手动初始化**
   - `initializeEventListeners()` 需要在应用启动时调用
   - 缺少明确的初始化文档

---

## 2️⃣ 任务模块 (Task Module)

**路径:** `/workspaces/dailyuse/apps/web/src/modules/task/application/services/`

### 📊 基本信息

| 项目                 | 内容                                           |
| -------------------- | ---------------------------------------------- |
| **Services 数量**    | 9 个                                           |
| **总方法数**         | 60+ 个（包括公开、私有方法）                   |
| **Store 依赖**       | ⚠️ Partial - 仅在 SyncService 中使用           |
| **Composables 需求** | ✅ Yes - 必须（错误处理、状态管理）            |
| **模式**             | Pattern A (ApplicationService 只负责 API 调用) |
| **优先级**           | **High**                                       |

### 📝 Services 列表

#### 1. **TaskInstanceApplicationService** ⭐

- **职责:** 任务实例的基本操作
- **Public Methods:**
  - `getTaskInstanceById()` - 获取任务实例详情
  - `deleteTaskInstance()` - 删除实例
  - `completeTaskInstance()` - 完成实例

- **Deprecated Methods:**
  - `createTaskInstance()` - ❌ 后端不支持
  - `updateTaskInstance()` - ❌ 后端不支持
  - `undoCompleteTaskInstance()` - ❌ 后端不支持
  - `cancelTaskInstance()` - ❌ 使用 skipTaskInstance 代替
  - `searchTaskInstances()` - ❌ 后端不支持

- **设计特点:**
  - 不依赖 Store，返回实体对象
  - 调用方负责存储
  - 轻量化 API

- **优点:**
  - ✅ 无循环依赖
  - ✅ 易于测试
  - ✅ 职责清晰

#### 2. **TaskTemplateApplicationService**

- **职责:** 任务模板 CRUD 操作
- **Public Methods:**
  - `createTaskTemplate()` - 创建模板
  - `getTaskTemplates()` - 获取模板列表
  - `getTaskTemplateById()` - 获取模板详情
  - `deleteTaskTemplate()` - 删除模板
  - `activateTaskTemplate()` - 激活模板（生成实例）
  - `pauseTaskTemplate()` - 暂停模板

- **设计特点:**
  - 返回实体对象，不依赖 Store
  - 激活返回 { template, instances }
  - Composable 层负责存储

#### 3. **TaskStatisticsApplicationService**

- **职责:** 任务统计数据
- **Public Methods:**
  - `getTaskStatistics()` - 获取统计数据
  - `recalculateStatistics()` - 重新计算统计
  - `deleteStatistics()` - 删除统计数据
  - `updateTemplateStats()` - 更新模板统计

- **依赖:** `useAccountStore()` - 获取当前用户 UUID

- **设计特点:**
  - 支持可选的 accountUuid 参数
  - 默认使用当前用户
  - 带有日志输出

#### 4. **TaskSyncApplicationService** ⭐⭐

- **职责:** 全量数据同步和缓存管理
- **Public Methods:**
  - `syncAllTaskData()` - 同步所有任务数据到 Store
  - `shouldSyncData()` - 检查是否需要同步
  - `forceSync()` - 强制重新同步

- **特殊设计:**
  - 这是 **唯一直接操作 Store** 的 Service
  - 需要原子性地更新整个数据集
  - 从 TaskTemplate 的 instances 提取数据（避免额外 API 调用）

- **缓存策略:**
  - 检查 Store 是否初始化
  - 检查是否有本地数据
  - 检查缓存是否过期

- **设计理由:**
  - 同步操作需要原子性，无法分解

#### 5. **TaskAutoStatusService**

- **职责:** 基于依赖关系自动更新任务状态
- **Public Methods:**
  - `updateTaskStatusOnDependencyChange()` - 根据依赖变化更新状态
  - `cascadeStatusUpdate()` - 级联更新后继任务
  - `analyzeTaskReadiness()` - 分析任务就绪性
  - `batchCalculateTaskStatus()` - 批量计算状态
  - `getBlockingTasksInfo()` - 获取阻塞任务信息
  - `canTaskStart()` - 检查任务是否可以开始

- **Public Event Methods:**
  - `onStatusChanged()` - 订阅状态变更事件
  - `onTaskReady()` - 订阅任务就绪事件
  - `onTaskBlocked()` - 订阅任务阻塞事件

- **内部实现:**
  - 使用 mitt EventBus
  - BFS 级联更新
  - DFS 循环依赖检测

- **设计特点:**
  - 事件驱动架构
  - 无 Store 依赖
  - 用于前端状态计算

#### 6. **TaskDependencyValidationService**

- **职责:** 依赖关系验证
- **Public Methods:**
  - `validateDependency()` - 综合验证依赖
  - `detectCircularDependency()` - DFS 循环检测
  - 其他验证方法（自依赖、重复、链深度）

- **验证类型:**
  - ✅ 基本规则验证
  - ✅ 自依赖检测
  - ✅ 重复依赖检测
  - ✅ 循环依赖检测（时间复杂度 O(V+E)）
  - ⚠️ 深链警告

- **返回结果:**
  ```typescript
  {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }
  ```

#### 7. **TaskCriticalPathService**

- **职责:** 关键路径法实现 (CPM)
- **Public Methods:**
  - `calculateCriticalPath()` - 计算关键路径
  - `topologicalSort()` - 拓扑排序
  - `calculateTaskTimings()` - 计算任务时序
  - `getProjectTimeline()` - 获取项目时间线

- **算法:**
  - 时间复杂度: O(V + E)
  - 正向计算 ES/EF
  - 反向计算 LS/LF
  - 识别零松弛任务

- **返回数据:**
  - 关键任务列表
  - 关键路径
  - 项目总工期
  - 优化建议

#### 8. **TaskDependencyGraphService**

- **职责:** 依赖图可视化 (ECharts)
- **Public Methods:**
  - `buildGraphData()` - 构建图数据
  - `getGraphForECharts()` - 获取 ECharts 格式数据
  - `highlightCriticalPath()` - 高亮关键路径
  - `getNodeLayout()` - 计算节点布局

- **功能:**
  - 任务状态颜色映射
  - 关键路径高亮
  - ECharts Graph 集成
  - DAG 可视化

- **节点颜色:**
  ```
  COMPLETED  → Green (#52C41A)
  IN_PROGRESS → Blue (#1890FF)
  READY      → Yellow (#FAAD14)
  BLOCKED    → Red (#F5222D)
  PENDING    → Gray (#D9D9D9)
  ```

#### 9. **TaskDependencyDragDropService**

- **职责:** 拖拽创建依赖关系
- **Public Methods:**
  - `createDependencyFromDrop()` - 从拖拽创建依赖
  - `validateDependency()` - 验证依赖

- **工作流:**
  1. 验证依赖合法性
  2. 调用 API 创建依赖
  3. 返回结果（由 Composable 显示提示）
  4. 触发 DAG 刷新（由调用方处理）

### 🔗 Store 依赖分析

```typescript
// TaskSyncApplicationService 直接操作 Store
import { useTaskStore } from '../../presentation/stores/taskStore';

private get taskStore() {
  return useTaskStore();
}

taskStore.setLoading(true);
taskStore.setTaskTemplates(templates);
taskStore.setTaskInstances(instances);

// 其他 Services 不依赖 Store
// 返回实体对象，由 Composable 层负责存储
```

### ⚠️ 关键问题

1. **TaskStatisticsApplicationService 依赖 useAccountStore()**
   - 不符合 Pattern A 设计原则
   - 应该由 Composable 传入 accountUuid

2. **任务状态更新流程不清晰**
   - `TaskAutoStatusService` 计算新状态但不更新
   - `TaskDependencyDragDropService` 创建依赖但不通知
   - 缺少端到端的同步机制

3. **缺少 TaskInstanceApplicationService.getTaskInstances()**
   - 多个 Service 都声称要使用此方法
   - 但实际未实现

---

## 3️⃣ AI 模块 (AI Module)

**路径:** `/workspaces/dailyuse/apps/web/src/modules/ai/application/services/`

### 📊 基本信息

| 项目                 | 内容                                    |
| -------------------- | --------------------------------------- |
| **Services 数量**    | 6 个                                    |
| **总方法数**         | 25+ 个 async 方法                       |
| **Store 依赖**       | ❌ No - Pattern A 完全遵循              |
| **Composables 需求** | ✅ Yes - 所有 UI 反馈由 Composable 处理 |
| **模式**             | Pattern A (纯 API 调用，无 Store 依赖)  |
| **优先级**           | **High**                                |

### 📝 Services 列表

#### 1. **AIConversationApplicationService**

- **职责:** AI 对话管理
- **Public Methods:**
  - `listConversations(params)` - 列出对话（支持分页）
  - `deleteConversation(uuid)` - 删除对话

- **设计特点:**
  - 最小化设计
  - 无 Store 依赖
  - 纯 API 包装

#### 2. **AIGenerationApplicationService**

- **职责:** AI 内容生成
- **Public Methods:**
  - `generateTaskTemplate()` - 生成任务模板
  - `generateTasks()` - 生成任务列表
  - `generateKnowledgeDocument()` - 生成知识文档
  - `getQuotaStatus()` - 获取配额状态

- **返回类型:**

  ```typescript
  // generateTasks() 返回
  {
    tasks: any[];
    tokenUsage: any;
    generatedAt: number;
  }
  ```

- **设计特点:**
  - 支持日志记录
  - 配额管理
  - 无状态设计

#### 3. **AIProviderApplicationService**

- **职责:** AI 服务提供商配置
- **Public Methods:**
  - `getProviders()` - 获取提供商列表
  - `createProvider()` - 创建提供商
  - `updateProvider()` - 更新提供商
  - `deleteProvider()` - 删除提供商
  - `testConnection()` - 测试连接
  - `setDefaultProvider()` - 设置默认提供商

- **设计特点:**
  - 完整的 CRUD
  - 连接测试功能
  - 日志记录

#### 4. **DocumentSummarizerApplicationService**

- **职责:** 文档摘要生成
- **Public Methods:**
  - `summarize()` - 生成文档摘要

- **返回类型:**

  ```typescript
  {
    summary: string;
    actionItems?: string[];
    metadata: {
      tokensUsed: number;
      compressionRatio: number;
    }
  }
  ```

- **设计特点:**
  - 单一职责
  - 元数据返回

#### 5. **GoalGenerationApplicationService**

- **职责:** AI 目标生成
- **Public Methods:**
  - `generateGoal()` - 从想法生成目标
  - `generateGoalWithKeyResults()` - 生成目标 + 关键结果
  - `refineGoal()` - 优化目标
  - 获取器: `isGenerating`, `lastError`, `lastGeneratedGoal`, `lastGeneratedKeyResults`

- **特性:**
  - 状态管理（isGenerating, lastError）
  - 缓存最近生成结果
  - 支持多种生成选项

- **设计理由:**
  - 内部状态用于显示生成进度
  - 缓存用于用户撤销/重做
  - 仍然不依赖 Store

#### 6. **KnowledgeGenerationApplicationService**

- **职责:** 知识文档 AI 生成
- **Public Methods:**
  - `generateKnowledge()` - 生成知识文档
  - `generateGoalKnowledge()` - 从目标生成知识
  - `generateGoalKnowledgeInline()` - 内联生成
  - 状态管理方法

- **特殊性:**
  - 直接调用 `useRepositoryStore()` 等其他模块的 Store
  - 创建文件夹和资源
  - 跨模块协调

- **问题:**
  - ❌ 违反 Pattern A（使用了其他模块的 Store）
  - 应该返回创建结果，由 Composable 处理 Store 更新

### 🔗 Store 依赖分析

```typescript
// AI 模块遵循 Pattern A - 无 Store 依赖
// 所有服务都是纯 API 调用

// ❌ 但 KnowledgeGenerationApplicationService 例外
import { useRepositoryStore } from '@/modules/repository/presentation/stores/repositoryStore';

// 这违反了 Pattern A，应该重构
```

### ⚠️ 关键问题

1. **GoalGenerationApplicationService 有内部状态**
   - 虽然没有依赖 Store，但保持了生成状态
   - 这是合理的（类似 useGenerateGoal Composable）
   - 但需要清晰文档说明

2. **KnowledgeGenerationApplicationService 直接操作 Store**
   - ❌ 违反 Pattern A
   - 应该分离为：
     1. 生成知识内容（纯 API）
     2. 创建仓储资源（返回结果给 Composable）

3. **缺少错误处理统一化**
   - 每个 Service 都有自己的错误处理方式
   - 应该统一为 Composable 层处理

---

## 4️⃣ 设置模块 (Setting Module)

**路径:** `/workspaces/dailyuse/apps/web/src/modules/setting/application/services/`

### 📊 基本信息

| 项目                 | 内容                                    |
| -------------------- | --------------------------------------- |
| **Services 数量**    | 2 个                                    |
| **总方法数**         | 20+ 个 async 方法                       |
| **Store 依赖**       | ✅ Yes - `useUserSettingStore()`        |
| **Vuetify 依赖**     | ⚠️ ThemeService 使用 Vuetify useTheme() |
| **Composables 需求** | ✅ Yes - UI 反馈和店铺初始化            |
| **模式**             | Mixed (UserSetting 服务 + Theme 服务)   |
| **优先级**           | **Medium**                              |

### 📝 Services 列表

#### 1. **UserSettingWebApplicationService** ⭐

- **职责:** 用户设置 CRUD 和协调
- **Public Methods:**
  - `getCurrentUserSettings()` - 获取当前设置
  - `getOrCreateUserSetting()` - 获取或创建
  - `getDefaultSettings()` - 获取默认设置
  - `updateUserSettings()` - 更新设置
  - `resetUserSettings()` - 重置设置
  - `exportSettings()` - 导出设置
  - `importSettings()` - 导入设置

- **专用更新方法:**
  - `updateAppearance()` - 更新外观（主题、字体等）
  - `updateLocale()` - 更新语言
  - `updateWorkflow()` - 更新工作流
  - `updatePrivacy()` - 更新隐私
  - `updateExperimental()` - 更新实验性功能

- **快捷方法:**
  - `updateTheme()` - 快速切换主题
  - `updateLanguage()` - 快速切换语言
  - `updateShortcut()` - 更新快捷键
  - `deleteShortcut()` - 删除快捷键

- **Store 调用:**

  ```typescript
  this.userSettingStore.settings = entity.toClientDTO();
  ```

- **工作流:**
  1. 调用 API 更新设置
  2. 重新加载完整设置
  3. 同步到 Store
  4. 返回实体对象

- **设计特点:**
  - 更新后重新加载（API 返回轻量级响应）
  - 支持导入/导出
  - 快捷方法提高易用性

#### 2. **ThemeService** ⭐⭐

- **职责:** Vuetify 主题管理
- **Public Methods:**
  - `initialize()` - 初始化服务
  - `getAvailableThemes()` - 获取可用主题列表
  - `hasTheme()` - 检查主题是否存在
  - `getCurrentTheme()` - 获取当前主题
  - `applySettings()` - 应用完整主题设置

- **主题设置方法:**
  - `setMode()` - 设置主题模式（LIGHT/DARK/AUTO）
  - `setThemeStyle()` - 设置具体主题样式
  - `setAccentColor()` - 设置主题色
  - `setFontSize()` - 设置字体大小（SMALL/MEDIUM/LARGE）
  - `setCompactMode()` - 设置紧凑模式

- **系统主题跟随:**
  - `watchSystemTheme()` - 监听系统主题变化
  - `unwatchSystemTheme()` - 取消监听
  - `getSystemPreference()` - 获取系统主题偏好

- **清理:**
  - `dispose()` - 清理资源

- **特殊设计:**
  - ⚠️ **必须在 Vue 组件 setup() 中初始化**
  - 直接使用 Vuetify `useTheme()` API
  - MediaQueryList 监听系统主题

- **初始化流程:**

  ```typescript
  // 1. App.vue setup()
  themeService.initialize(); // 获取 Vuetify 主题实例

  // 2. App.vue onMounted()
  settingStore.initializeSettings(); // 加载用户设置
  // 自动调用 themeService.applySettings()

  // 3. 用户修改主题
  userSettingStore.updateAppearance({ theme: 'LIGHT' });
  themeService.setMode('LIGHT'); // 立即生效
  ```

- **主题模式:**
  ```typescript
  LIGHT → 固定浅色
  DARK  → 固定深色
  AUTO  → 跟随系统（监听 prefers-color-scheme）
  ```

### 🔗 Vuetify 依赖分析

```typescript
import { useTheme } from 'vuetify';
import type { ThemeInstance } from 'vuetify';

// 直接依赖 Vuetify
private theme: ThemeInstance | null = null;

// 需要在 Vue 组件中调用
initialize(): void {
  this.theme = useTheme(); // 只能在组件 setup 中调用
}

// 操作 Vuetify 主题
this.theme.global.name.value = 'dark';
this.theme.themes.value[themeName].colors.primary = color;
```

### 🔗 Store 依赖分析

```typescript
// UserSettingWebApplicationService
import { useUserSettingStore } from '../../presentation/stores/userSettingStore';

private get userSettingStore() {
  return useUserSettingStore();
}

// 更新 Store
this.userSettingStore.settings = entity.toClientDTO();
```

### ⚠️ 关键问题

1. **ThemeService 初始化限制**
   - ❌ 只能在 Vue 组件 setup() 中调用 useTheme()
   - ❌ 当前设计有初始化顺序风险
   - 解决方案：
     - 使用 createApp() 中的 setup
     - 或使用 Composable 包装

2. **主题初始化顺序**
   - 需要确保：
     1. App.vue setup() → themeService.initialize()
     2. App.vue onMounted() → settingStore.initializeSettings()
   - 缺少清晰的文档说明

3. **主题颜色 CSS 变量**
   - 使用 `document.documentElement.style.setProperty()`
   - 需要确保 CSS 变量已定义

4. **UserSettingWebApplicationService 方法过多**
   - 20+ 个方法，职责不够聚焦
   - 建议拆分为：
     - UserSettingApplicationService（基础 CRUD）
     - AppearanceApplicationService（外观相关）
     - ShortcutApplicationService（快捷键）

---

## 📈 对比分析表

| 特性               | Reminder | Task       | AI                    | Setting |
| ------------------ | -------- | ---------- | --------------------- | ------- |
| **Services 数量**  | 4        | 9          | 6                     | 2       |
| **Store 依赖**     | ✅ 混用  | ⚠️ 仅 Sync | ❌ 无（除 Knowledge） | ✅ 是   |
| **API 调用**       | ✅ 是    | ✅ 是      | ✅ 是                 | ✅ 是   |
| **事件驱动**       | ✅ 是    | ❌ 否      | ❌ 否                 | ❌ 否   |
| **缓存管理**       | ✅ 是    | ✅ 是      | ❌ 否                 | ❌ 否   |
| **Pattern A 遵循** | ⚠️ 部分  | ✅ 是      | ⚠️ 部分               | ❌ 否   |
| **方法数/Service** | 6-7      | 6-15       | 4-8                   | 10-15   |
| **优先级**         | High     | High       | High                  | Medium  |

---

## 🎯 关键建议

### Reminder 模块

1. ✅ 统一 Store 获取方式（使用 `useReminderStore()`）
2. 🔧 将错误处理移到 Composable 层
3. 📚 明确文档 `initializeEventListeners()` 的调用时机

### Task 模块

1. ✅ 完美遵循 Pattern A（TaskSyncService 例外）
2. 🔧 TaskStatisticsApplicationService 不应该依赖 useAccountStore()
3. 🔧 补充缺失的 `TaskInstanceApplicationService.getTaskInstances()`
4. 📚 明确任务状态更新的完整流程

### AI 模块

1. ✅ 遵循 Pattern A（KnowledgeGenerationService 例外）
2. 🔧 KnowledgeGenerationApplicationService 不应直接操作 Repository Store
3. ✅ 保留 GoalGenerationApplicationService 的内部状态（合理设计）

### Setting 模块

1. 🔧 ThemeService 初始化顺序有风险
2. 🔧 考虑拆分 UserSettingWebApplicationService
3. 📚 明确 ThemeService 的初始化文档
4. ✅ 设计总体完整，但需要优化

---

## 📊 总体评分

### 模块评分

| 模块         | Pattern A | 可维护性 | 可测试性 | 缺陷 | 分数      |
| ------------ | --------- | -------- | -------- | ---- | --------- |
| **Task**     | ✅ 90%    | 85%      | 90%      | 低   | 🟢 85/100 |
| **AI**       | ✅ 83%    | 80%      | 85%      | 低   | 🟡 80/100 |
| **Reminder** | ⚠️ 60%    | 70%      | 75%      | 中   | 🟡 70/100 |
| **Setting**  | ❌ 50%    | 65%      | 60%      | 中   | 🟠 60/100 |

### 优先修复顺序

1. **Task 模块** - 已非常好，小优化
   - 修复 TaskStatisticsApplicationService Store 依赖
   - 补充 getTaskInstances() 方法

2. **AI 模块** - 需要小调整
   - 修复 KnowledgeGenerationApplicationService Store 依赖
   - 统一错误处理

3. **Reminder 模块** - 需要中等调整
   - 统一 Store 获取方式
   - 移动错误处理逻辑

4. **Setting 模块** - 需要中等重构
   - ThemeService 初始化风险修复
   - UserSettingWebApplicationService 拆分
