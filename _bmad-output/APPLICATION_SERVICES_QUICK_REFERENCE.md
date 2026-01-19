# 4 大模块 ApplicationServices 快速参考

## 模块概览

```
Module: Reminder
Services: 4
Store dependency: Yes (useReminderStore)
Total Methods: 25+ async methods
Needs Composables: Yes
Priority: High
Pattern: Pattern A (API + DTO 转换)
Issues: 混用两种 Store 获取方式、错误处理在 Service 层

Module: Task
Services: 9
Store dependency: Partial (仅 TaskSyncApplicationService)
Total Methods: 60+ (public + private)
Needs Composables: Yes
Priority: High
Pattern: Pattern A (纯 API 调用)
Issues: TaskStatisticsApplicationService 依赖 useAccountStore()、缺少 getTaskInstances()

Module: AI
Services: 6
Store dependency: No (除 KnowledgeGenerationApplicationService)
Total Methods: 25+ async methods
Needs Composables: Yes
Priority: High
Pattern: Pattern A (纯 API 调用)
Issues: KnowledgeGenerationApplicationService 直接操作其他 Store

Module: Setting
Services: 2
Store dependency: Yes (useUserSettingStore)
Total Methods: 20+ async methods
Needs Composables: Yes
Priority: Medium
Pattern: Mixed (偏离 Pattern A)
Issues: ThemeService 初始化风险、UserSettingWebApplicationService 方法过多
```

---

## Reminder 模块详情

### ReminderGroupApplicationService (7 methods)

- ✅ createReminderGroup()
- ✅ getReminderGroups() - 支持分页
- ✅ getReminderGroup()
- ✅ updateReminderGroup()
- ✅ deleteReminderGroup()
- ✅ toggleReminderGroupStatus()
- ✅ toggleReminderGroupControlMode()

### ReminderTemplateApplicationService (9 methods)

- ✅ createReminderTemplate()
- ✅ getReminderTemplates() - 缓存优先策略
- ✅ getReminderTemplate()
- ✅ updateReminderTemplate()
- ✅ deleteReminderTemplate()
- ✅ toggleTemplateEnabled()
- ✅ searchTemplates()
- ✅ moveTemplateToGroup()
- ✅ getUpcomingReminders()

### ReminderStatisticsApplicationService (1 method)

- ✅ getReminderStatistics()

### ReminderSyncApplicationService (5+ methods)

- ✅ initializeEventListeners() - 初始化事件监听
- ✅ syncAllTemplatesAndGroups() - 同步所有数据
- ✅ refreshAll() - 刷新所有数据
- 🔒 handleTemplateRefreshEvent() - 私有
- 🔒 handleGroupRefreshEvent() - 私有
- 🔒 refreshAllTemplates() - 私有
- 🔒 refreshAllGroups() - 私有
- 🔒 cleanup() - 私有

---

## Task 模块详情

### TaskInstanceApplicationService (3 public methods)

- ✅ getTaskInstanceById()
- ✅ deleteTaskInstance()
- ✅ completeTaskInstance()
- ❌ createTaskInstance() - 后端不支持
- ❌ updateTaskInstance() - 后端不支持
- ❌ cancelTaskInstance() - 使用 skipTaskInstance
- ❌ undoCompleteTaskInstance() - 后端不支持

### TaskTemplateApplicationService (6 methods)

- ✅ createTaskTemplate()
- ✅ getTaskTemplates()
- ✅ getTaskTemplateById()
- ✅ deleteTaskTemplate()
- ✅ activateTaskTemplate() - 返回 { template, instances }
- ✅ pauseTaskTemplate()

### TaskStatisticsApplicationService (4 methods)

- ✅ getTaskStatistics()
- ✅ recalculateStatistics()
- ✅ deleteStatistics()
- ✅ updateTemplateStats()

### TaskSyncApplicationService (3 methods)

- ✅ syncAllTaskData() - 直接操作 Store
- ✅ shouldSyncData() - 缓存检查
- ✅ forceSync() - 强制同步

### TaskAutoStatusService (6 methods)

- ✅ updateTaskStatusOnDependencyChange()
- ✅ cascadeStatusUpdate() - 级联更新
- ✅ analyzeTaskReadiness()
- ✅ batchCalculateTaskStatus()
- ✅ getBlockingTasksInfo()
- ✅ canTaskStart()
- 🎧 onStatusChanged() - 事件订阅
- 🎧 onTaskReady() - 事件订阅
- 🎧 onTaskBlocked() - 事件订阅

### TaskDependencyValidationService (1 main method)

- ✅ validateDependency() - 综合验证
  - 自依赖检测
  - 重复依赖检测
  - 循环依赖检测 (DFS, O(V+E))
  - 链深度警告

### TaskCriticalPathService (4 methods)

- ✅ calculateCriticalPath() - 关键路径算法
- ✅ topologicalSort()
- ✅ calculateTaskTimings() - 计算 ES/EF/LS/LF
- ✅ getProjectTimeline()

### TaskDependencyGraphService (4 methods)

- ✅ buildGraphData() - 构建图数据
- ✅ getGraphForECharts() - ECharts 格式
- ✅ highlightCriticalPath()
- ✅ getNodeLayout()

### TaskDependencyDragDropService (2 methods)

- ✅ createDependencyFromDrop()
- ✅ validateDependency()

---

## AI 模块详情

### AIConversationApplicationService (2 methods)

- ✅ listConversations()
- ✅ deleteConversation()

### AIGenerationApplicationService (4 methods)

- ✅ generateTaskTemplate()
- ✅ generateTasks() - 返回 { tasks, tokenUsage, generatedAt }
- ✅ generateKnowledgeDocument()
- ✅ getQuotaStatus()

### AIProviderApplicationService (6 methods)

- ✅ getProviders()
- ✅ createProvider()
- ✅ updateProvider()
- ✅ deleteProvider()
- ✅ testConnection()
- ✅ setDefaultProvider()

### DocumentSummarizerApplicationService (1 method)

- ✅ summarize() - 返回 { summary, actionItems, metadata }

### GoalGenerationApplicationService (2+ methods + getters)

- ✅ generateGoal()
- ✅ generateGoalWithKeyResults()
- 📊 isGenerating - getter
- 📊 lastError - getter
- 📊 lastGeneratedGoal - getter
- 📊 lastGeneratedKeyResults - getter

### KnowledgeGenerationApplicationService (3+ methods)

- ✅ generateKnowledge()
- ✅ generateGoalKnowledge()
- ✅ generateGoalKnowledgeInline()
- ⚠️ 直接操作 Repository Store

---

## Setting 模块详情

### UserSettingWebApplicationService (15+ methods)

**基础 CRUD:**

- ✅ getCurrentUserSettings()
- ✅ getOrCreateUserSetting()
- ✅ getDefaultSettings()
- ✅ updateUserSettings()
- ✅ resetUserSettings()

**专用更新:**

- ✅ updateAppearance() - 主题、字体
- ✅ updateLocale() - 语言
- ✅ updateWorkflow() - 工作流
- ✅ updatePrivacy() - 隐私
- ✅ updateExperimental() - 实验性功能

**快捷方法:**

- ✅ updateTheme()
- ✅ updateLanguage()
- ✅ updateShortcut()
- ✅ deleteShortcut()

**导入导出:**

- ✅ exportSettings()
- ✅ importSettings()

### ThemeService (10+ methods)

**初始化:**

- ✅ initialize() - ⚠️ 只能在 Vue setup() 中调用
- ✅ dispose()

**主题管理:**

- ✅ getAvailableThemes()
- ✅ hasTheme()
- ✅ getCurrentTheme()
- ✅ applySettings() - 应用完整设置

**设置方法:**

- ✅ setMode() - LIGHT/DARK/AUTO
- ✅ setThemeStyle() - 具体主题名称
- ✅ setAccentColor()
- ✅ setFontSize() - SMALL/MEDIUM/LARGE
- ✅ setCompactMode()

**系统主题:**

- 🔒 watchSystemTheme() - 私有
- 🔒 unwatchSystemTheme() - 私有
- 🔒 getSystemPreference() - 私有

---

## 关键数据结构

### Reminder 事件

```typescript
ReminderEvents {
  TEMPLATE_REFRESH
  GROUP_REFRESH
  TEMPLATES_REFRESH_ALL
  GROUPS_REFRESH_ALL
}
```

### Task 状态

```typescript
TaskStatus: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
```

### Task 时序信息

```typescript
TaskTiming {
  uuid, title, duration
  earliestStart, earliestFinish
  latestStart, latestFinish
  slack, isCritical
}
```

### AI 生成响应

```typescript
GenerateTasksResponse {
  tasks: any[]
  tokenUsage: any
  generatedAt: number
}
```

### Theme 模式

```typescript
ThemeMode: 'LIGHT' | 'DARK' | 'AUTO';
FontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
```

---

## 修复优先级排序

### 🔴 需要立即修复

1. Task.TaskStatisticsApplicationService - 移除 useAccountStore() 依赖
2. ThemeService - 修复初始化顺序风险
3. AI.KnowledgeGenerationApplicationService - 不直接操作 Repository Store

### 🟠 需要优化

1. Reminder - 统一 Store 获取方式
2. UserSettingWebApplicationService - 拆分职责
3. Task - 补充 getTaskInstances() 方法

### 🟡 可以改进

1. Reminder - 将错误处理移到 Composable 层
2. AI - 统一错误处理方式
3. Setting - 更新文档说明初始化流程

---

## 最佳实践检查清单

### Reminder

- [ ] 统一 Store 获取：useReminderStore()
- [ ] 文档：initializeEventListeners() 调用时机
- [ ] 测试：事件驱动同步流程

### Task

- [ ] 修复：TaskStatisticsApplicationService - 传入 accountUuid
- [ ] 补充：getTaskInstances() 方法
- [ ] 文档：任务状态更新完整流程

### AI

- [ ] 修复：KnowledgeGenerationApplicationService - 返回结果给 Composable
- [ ] 统一：所有 Services 的错误处理
- [ ] 测试：生成 Services 的状态管理

### Setting

- [ ] 修复：ThemeService 初始化 guards
- [ ] 拆分：UserSettingWebApplicationService
  - AppearanceService
  - LocaleService
  - ShortcutService
  - PrivacyService
- [ ] 文档：完整的初始化流程
