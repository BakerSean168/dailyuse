# Phase 2: 逐模块迁移到 app-vue (预计 5-8 天)

## 目标

将各业务模块从 `apps/web/src/modules/` 和 `packages/ui-vue-shadcn/src/components/custom/` 迁移到 `packages/app-vue/src/modules/`，实现前端业务逻辑在 Web 和 Desktop 间的完全共享。

---

## 2.1 迁移策略

### 2.1.1 每个模块的标准迁移步骤

```
对于模块 {module}:

1. 创建目标目录结构
   └── packages/app-vue/src/modules/{module}/
       ├── index.ts
       ├── components/     ← 从 ui-vue-shadcn/custom/{module}/ 迁入
       ├── composables/    ← 从 web/modules/{module}/presentation/composables/ 迁入
       ├── stores/         ← 从 web/modules/{module}/presentation/stores/ 迁入
       ├── views/          ← 从 web/modules/{module}/presentation/views/ 迁入
       ├── widgets/        ← 从 web/modules/{module}/presentation/widgets/ 迁入（如有）
       └── router/         ← 从 web/modules/{module}/presentation/router/ 迁入（如有）

2. 复制文件
3. 更新 import 路径
4. 统一 API 调用模式（DI + Result 模式）
5. 从 ui-vue-shadcn/index.ts 中移除对应的 custom 组件导出
6. 从 app-vue/src/modules/{module}/index.ts 导出公共 API
7. 在 app-vue/src/index.ts 中添加模块导出
8. 验证 web 仍然正常工作
```

### 2.1.2 API 调用模式统一

**迁移前**（直接依赖 HTTP 客户端）：
```typescript
// ❌ 旧模式：直接使用 httpClient
import { resultHttpClient } from '@dailyuse/http-client';

const response = await resultHttpClient.get('/api/tasks');
```

**迁移后**（通过 DI 注入）：
```typescript
// ✅ 新模式：通过 DI 获取服务接口
import { inject } from 'vue';
import { TASK_SERVICE_KEY } from '../../di/keys';

const taskService = inject(TASK_SERVICE_KEY)!;
const result = await taskService.getAll();
```

### 2.1.3 迁移顺序原则

按复杂度递增，先迁移简单模块验证流程，再处理复杂模块：

| 批次 | 模块 | 复杂度 | 预计耗时 |
|------|------|--------|---------|
| 第一批 | setting, account, authentication | 低 | 1-2 天 |
| 第二批 | notification, reminder, editor | 中 | 1-2 天 |
| 第三批 | schedule, repository, governance | 中偏高 | 1-2 天 |
| 第四批 | task, goal | 高 | 2-3 天 |

---

## 2.2 第一批迁移：简单模块

### 2.2.1 setting 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/setting/presentation/composables/` | `useSetting.ts`, `index.ts` | `app-vue/modules/setting/composables/` |
| `web/modules/setting/presentation/stores/` | `settingStore.ts`, `userSettingStore.ts` | `app-vue/modules/setting/stores/` |
| `web/modules/setting/presentation/views/` | `UserSettingsView.vue` | `app-vue/modules/setting/views/` |
| `web/modules/setting/presentation/router/` | `index.ts` | `app-vue/modules/setting/router/` |
| `ui-vue-shadcn/custom/setting/` | 11 个组件（AppearanceSettings、EditorSettings 等） | `app-vue/modules/setting/components/` |

**特殊处理**:
- `settingStore.ts` 和 `userSettingStore.ts` 两个 store 需同时迁移
- 9 个 Settings 子组件从 index.ts 导出，需更新 barrel export

**导出清单（index.ts）**:
```typescript
export { UserSettingsView } from './views/UserSettingsView.vue';
export { default as AppearanceSettings } from './components/AppearanceSettings.vue';
export { default as EditorSettings } from './components/EditorSettings.vue';
export { default as ExperimentalSettings } from './components/ExperimentalSettings.vue';
export { default as LocaleSettings } from './components/LocaleSettings.vue';
export { default as PrivacySettings } from './components/PrivacySettings.vue';
export { default as RepositorySettings } from './components/RepositorySettings.vue';
export { default as ShortcutSettings } from './components/ShortcutSettings.vue';
export { default as WorkflowSettings } from './components/WorkflowSettings.vue';
export { default as AdvancedActions } from './components/AdvancedActions.vue';
export { useSettingStore } from './stores/settingStore';
export { useSetting } from './composables/useSetting';
export { settingRoutes } from './router';
```

### 2.2.2 account 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/account/presentation/composables/` | `useAccount.ts`, `index.ts` | `app-vue/modules/account/composables/` |
| `web/modules/account/presentation/stores/` | `accountStore.ts` | `app-vue/modules/account/stores/` |
| `web/modules/account/presentation/views/` | `AccountCenterView.vue` | `app-vue/modules/account/views/` |
| `web/modules/account/presentation/router/` | `index.ts` | `app-vue/modules/account/router/` |
| `ui-vue-shadcn/custom/account/` | `ProfileCard.vue`, `ProfileForm.vue`, `ProfileAvatar.vue` | `app-vue/modules/account/components/` |

**特殊处理**:
- 最简单的模块之一，3 个组件 + 1 个 view + 1 个 store
- 适合作为迁移流程验证的首个模块

### 2.2.3 authentication 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/authentication/presentation/composables/` | `useAuth.ts`, `usePassword.ts`, `useSession.ts`, `index.ts` | `app-vue/modules/authentication/composables/` |
| `web/modules/authentication/presentation/stores/` | `authenticationStore.ts` | `app-vue/modules/authentication/stores/` |
| `web/modules/authentication/presentation/views/` | `AuthView.vue` | `app-vue/modules/authentication/views/` |
| `ui-vue-shadcn/custom/authentication/` | `LoginForm.vue`, `RegisterForm.vue`, `ForgotPasswordForm.vue` | `app-vue/modules/authentication/components/` |

**特殊处理**:
- 无独立路由文件（认证路由在顶层路由定义中）
- `useSession.ts` 管理 token 持久化，需确保在 DI 模式下仍然工作
- `AuthView.vue` 需要支持 Web（路由跳转）和 Desktop（关闭窗口）两种登录成功回调
- **关键设计**: 登录成功后的行为通过 DI 注入 `onLoginSuccess` 回调来区分平台

---

## 2.3 第二批迁移：中等复杂度模块

### 2.3.1 notification 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/notification/presentation/composables/` | `useNotification.ts`, `index.ts` | `app-vue/modules/notification/composables/` |
| `web/modules/notification/presentation/stores/` | `notificationStore.ts` | `app-vue/modules/notification/stores/` |
| `web/modules/notification/presentation/views/` | `NotificationListPage.vue`, `SSEMonitorPage.vue` | `app-vue/modules/notification/views/` |
| `web/modules/notification/presentation/router/` | `index.ts` | `app-vue/modules/notification/router/` |
| `ui-vue-shadcn/custom/notification/` | 8 个组件（Bell、Drawer、List 等） | `app-vue/modules/notification/components/` |
| `web/modules/notification/initialization/` | `notificationInitialization.ts` | `app-vue/modules/notification/initialization/` |

**特殊处理**:
- SSE 连接初始化需要区分 Web（SSE）和 Desktop（IPC）模式
- `InAppNotification` 和 `NotificationPermissionWarning` 组件是全局性的

### 2.3.2 reminder 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/reminder/presentation/` | composables, stores, views, widgets, utils | `app-vue/modules/reminder/` 对应目录 |
| `ui-vue-shadcn/custom/reminder/` | 17 个组件（TemplateCard、GroupDialog 等） | `app-vue/modules/reminder/components/` |

**特殊处理**:
- 包含 `utils/upcomingReminderCalculator.ts`，属于纯逻辑，直接迁移
- Widget 注册逻辑需迁移

### 2.3.3 editor 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/editor/presentation/composables/` | `useAutoSave.ts`, `useEditor.ts`, `useMarkdownEditor.ts` | `app-vue/modules/editor/composables/` |
| `web/modules/editor/presentation/views/` | `EditorLinearView.vue` | `app-vue/modules/editor/views/` |
| `ui-vue-shadcn/custom/editor/` | 12 个组件（MarkdownEditor、ObsidianEditor 等） | `app-vue/modules/editor/components/` |

**特殊处理**:
- 无独立 store 和 router
- Milkdown 编辑器依赖较重，确保 tree-shaking 正确
- `useMilkdown.ts` composable 在 repository 模块中，需协调引用

---

## 2.4 第三批迁移：中偏复杂模块

### 2.4.1 schedule 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/schedule/presentation/` | composables, stores, views, widgets, router | `app-vue/modules/schedule/` 对应目录 |
| `ui-vue-shadcn/custom/schedule/` | 19 个组件（WeekView、StatCard、TimelineEntry 等） | `app-vue/modules/schedule/components/` |

**特殊处理**:
- 组件较多（19 个），全部为根级别文件（无子目录）
- `ScheduleDashboardView` 和 `ScheduleWeekView` 是两个主视图

### 2.4.2 repository 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/repository/presentation/` | composables(3), stores, views(5), router | `app-vue/modules/repository/` |
| `ui-vue-shadcn/custom/repository/` | 19 个组件（FileTree、RepoCard、MediaViewer 等） | `app-vue/modules/repository/components/` |

**特殊处理**:
- 3 个 composables（`useRepository`, `useMilkdown`, `useLinkPreview`），依赖较多
- 5 个 views（RepositoryDetailView、LinearView、ListView、Page、View），结构较复杂
- `useMilkdown` 同时被 editor 模块引用，需放在 shared 或单独处理

### 2.4.3 governance 模块

**来源文件**:

| 来源 | 文件 | 目标位置 |
|------|------|---------|
| `web/modules/governance/presentation/` | composables, stores, views(4), widgets, router | `app-vue/modules/governance/` |
| `web/modules/governance/composables/` | `useGovernance.ts` | `app-vue/modules/governance/composables/` |
| `web/modules/governance/presentation/components/` | `RevisionCard.vue` | `app-vue/modules/governance/components/` |
| `ui-vue-shadcn/custom/governance/` | 11 个组件（RuleCard、SearchBar 等） | `app-vue/modules/governance/components/` |

**特殊处理**:
- 模块内有 `composables/` 和 `presentation/composables/` 两层，需合并
- 4 个 views + RevisionCard 组件 + 2 个 widgets
- 已有注册路由，迁移后需更新路由引用路径

---

## 2.5 第四批迁移：最复杂模块

### 2.5.1 task 模块

**来源文件**:

| 来源 | 文件数 | 目标位置 |
|------|--------|---------|
| `web/modules/task/presentation/composables/` | 2 | `app-vue/modules/task/composables/` |
| `web/modules/task/presentation/stores/` | 1 | `app-vue/modules/task/stores/` |
| `web/modules/task/presentation/views/` | 4 | `app-vue/modules/task/views/` |
| `web/modules/task/presentation/widgets/` | 2 | `app-vue/modules/task/widgets/` |
| `web/modules/task/presentation/router/` | 1 | `app-vue/modules/task/router/` |
| `web/modules/task/types/` | 1 | `app-vue/modules/task/types/` |
| `ui-vue-shadcn/custom/task/` | **~30+ 组件** | `app-vue/modules/task/components/` |

**ui-vue-shadcn/custom/task/ 完整组件清单**:
```
根级别:
├── TaskAIGenerationDialog.vue
├── TaskDependencyGraph.vue
├── TaskInstanceCard.vue
├── TaskInstanceManagement.vue
├── TaskTemplateManagement.vue

子目录:
├── TaskTemplateForm/           # 模板表单（2+ 子组件）
├── cards/                      # 卡片组件（6 个）
├── critical-path/              # 关键路径（2 个）
├── dag/                        # DAG 可视化（2 个）
├── dependency/                 # 依赖管理（4 个）
├── dialogs/                    # 对话框（4 个）
└── widgets/                    # 小部件（3 个）
```

**特殊处理**:
- 最复杂模块，30+ 组件 + 多层嵌套目录
- `task-dag.types.ts` 需一并迁移
- Task 依赖 DAG 可视化有复杂的图形渲染逻辑
- DI 接口需要 3 个服务（Template、Instance、Dependency）
- 建议保持 `custom/task/` 的子目录结构不变

### 2.5.2 goal 模块

**来源文件**:

| 来源 | 文件数 | 目标位置 |
|------|--------|---------|
| `web/modules/goal/presentation/composables/` | 2 | `app-vue/modules/goal/composables/` |
| `web/modules/goal/presentation/stores/` | 1 | `app-vue/modules/goal/stores/` |
| `web/modules/goal/presentation/views/` | **9** | `app-vue/modules/goal/views/` |
| `web/modules/goal/presentation/widgets/` | 2 | `app-vue/modules/goal/widgets/` |
| `web/modules/goal/presentation/router/` | 1 | `app-vue/modules/goal/router/` |
| `ui-vue-shadcn/custom/goal/` | **~39 组件** | `app-vue/modules/goal/components/` |

**ui-vue-shadcn/custom/goal/ 完整组件清单**:
```
根级别 (8 个):
├── GoalAIGeneration.vue
├── GoalAIKResults.vue
├── GoalCard.vue
├── GoalFocusDialog.vue
├── GoalFocusHistory.vue
├── GoalFocusStatus.vue
├── GoalFolderManagement.vue
├── GoalProgressPanel.vue

子目录:
├── cards/              # 卡片组件（6 个）
├── comparison/         # 对比组件（2 个）
├── composables/        # 组合式函数（1 个：useGoalTimeline）
├── dag/                # DAG 可视化（2 个）
├── dialogs/            # 对话框（4 个）
├── echarts/            # ECharts 图表（7 个）
├── rules/              # 规则组件（1 个）
├── template/           # 模板组件（1 个）
├── timeline/           # 时间线（2 个）
├── weight/             # 权重组件（1 个）
└── weight-snapshot/    # 权重快照（3 个）
```

**特殊处理**:
- 最大模块：39 个组件 + 9 个 views
- ECharts 图表依赖较重，需确保正确配置
- Goal 模块的 `composables/` 在 ui-vue-shadcn 中也有一个（`useGoalTimeline`），需合并
- Focus 相关组件（Dialog、History、Status）形成独立功能群
- DAG 可视化与 Task 模块有共同模式，可考虑提取到 shared

---

## 2.6 application 目录迁移

### 2.6.1 `ui-vue-shadcn/custom/application/`

| 子目录 | 内容 | 目标位置 |
|--------|------|---------|
| `composables/` | 1 个应用级 composable | `app-vue/shared/composables/` |
| `services/` | 1 个应用级服务 | `app-vue/shared/services/` |
| 根级别 Vue 文件 | 3 个通用应用组件 | `app-vue/shared/components/` |
| `templates/` | 模板文件（如有） | `app-vue/shared/templates/` |

### 2.6.2 `ui-vue-shadcn/custom/composables/`

| 文件 | 目标位置 |
|------|---------|
| `useGoal.ts` | `app-vue/modules/goal/composables/useGoal.ts` |
| `useGoalTimeline.ts` | `app-vue/modules/goal/composables/useGoalTimeline.ts` |

---

## 2.7 初始化逻辑迁移策略

各模块在 `web/modules/{module}/initialization/` 下有初始化逻辑（widget 注册、数据预加载等）。

**策略**:
- 初始化逻辑随模块迁入 `app-vue/modules/{module}/initialization/`
- 初始化注册点由宿主应用（Web 或 Desktop）调用
- `app-vue` 导出 `initializeModule()` 函数，宿主在 `main.ts` 中调用

---

## 2.8 linear 组件处理

`ui-vue-shadcn/custom/linear/` 包含 5 个通用布局组件：
- `LinearListItem.vue`
- `LinearPageHeader.vue`
- `LinearPanel.vue`
- `LinearSidebarItem.vue`
- `index.ts`

**决策**: **保留在 ui-vue-shadcn 中**，因为这些是通用布局组件，非业务组件。

---

## 2.9 import 路径更新规则

### 迁移前后 import 对照

```typescript
// === 业务组件 ===
// 迁移前
import { TaskInstanceCard } from '@dailyuse/ui-vue-shadcn';
// 迁移后
import { TaskInstanceCard } from '@dailyuse/app-vue/modules/task';

// === Composables ===
// 迁移前
import { useTask } from '@/modules/task/presentation/composables';
// 迁移后
import { useTask } from '@dailyuse/app-vue/modules/task';

// === Stores ===
// 迁移前
import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';
// 迁移后
import { useTaskStore } from '@dailyuse/app-vue/modules/task';

// === shadcn UI 原子组件（保持不变）===
import { Button, Card, Dialog } from '@dailyuse/ui-vue-shadcn';
```

---

## 2.10 验证策略

### 每个模块迁移后的验证

```bash
# 1. 类型检查
nx run app-vue:typecheck

# 2. 编译
nx build app-vue

# 3. Web 仍然正常
nx build web
nx test web

# 4. 功能验证（手动）
pnpm dev:web
# 在浏览器中验证对应模块的页面和功能
```

### 迁移完成后的全面验证

```bash
# 所有项目编译
pnpm build

# 所有测试
pnpm test

# 类型检查
pnpm typecheck

# Lint
pnpm lint
```

---

## 2.11 模块迁移总览

| 模块 | Web 文件数 | Custom 组件数 | 总计 | 依赖复杂度 | 迁移批次 |
|------|-----------|-------------|------|-----------|---------|
| setting | ~10 | 11 | ~21 | 低 | 第一批 |
| account | ~8 | 3 | ~11 | 低 | 第一批 |
| authentication | ~9 | 3 | ~12 | 低 | 第一批 |
| notification | ~11 | 8 | ~19 | 中 | 第二批 |
| reminder | ~12 | 17 | ~29 | 中 | 第二批 |
| editor | ~6 | 12 | ~18 | 中 | 第二批 |
| schedule | ~10 | 19 | ~29 | 中高 | 第三批 |
| repository | ~13 | 19 | ~32 | 中高 | 第三批 |
| governance | ~11 | 11 | ~22 | 中 | 第三批 |
| task | ~15 | 30+ | ~45+ | **高** | 第四批 |
| goal | ~17 | 39 | ~56 | **最高** | 第四批 |
| application | - | 5 | ~5 | 低 | 合并到 shared |
| composables | - | 2 | ~2 | 低 | 合并到 goal |
| **总计** | **~136** | **~179** | **~315+** | | |

---

## 2.12 检查清单

- [ ] **第一批**: setting 模块迁移完成 + 验证
- [ ] **第一批**: account 模块迁移完成 + 验证
- [ ] **第一批**: authentication 模块迁移完成 + 验证
- [ ] **第二批**: notification 模块迁移完成 + 验证
- [ ] **第二批**: reminder 模块迁移完成 + 验证
- [ ] **第二批**: editor 模块迁移完成 + 验证
- [ ] **第三批**: schedule 模块迁移完成 + 验证
- [ ] **第三批**: repository 模块迁移完成 + 验证
- [ ] **第三批**: governance 模块迁移完成 + 验证
- [ ] **第四批**: task 模块迁移完成 + 验证
- [ ] **第四批**: goal 模块迁移完成 + 验证
- [ ] application/composables 合并迁移完成
- [ ] 所有模块路由在 app-vue 统一注册
- [ ] 所有 `ui-vue-shadcn/custom/` 中的业务组件导出已移除
- [ ] 全面编译 + 测试 + 类型检查通过
