# Phase 0: 清理 (预计 1-2 天)

## 目标

移除已废弃的代码、包和残留调试信息，确保项目在进入正式重构前处于一个干净、可编译、可测试的基线状态。

---

## 0.1 删除废弃的 UI 包

### 0.1.1 删除 `packages/ui-react/`

- **路径**: `packages/ui-react/`
- **原因**: Desktop renderer 将从 React 重写为 Vue 3，React UI 包不再需要
- **包名**: `@dailyuse/ui-react`
- **内容**: Storybook 配置、React 组件源码、tsup 打包配置
- **操作步骤**:
  1. 删除整个 `packages/ui-react/` 目录
  2. 从 `tsconfig.base.json` 中移除路径别名 `@dailyuse/ui-react`
  3. 检查并移除其他包中对 `@dailyuse/ui-react` 的依赖引用

### 0.1.2 删除 `packages/ui-react-shadcn/`

- **路径**: `packages/ui-react-shadcn/`
- **原因**: Desktop renderer 的 React shadcn 组件库，重写后不再使用
- **包名**: `@dailyuse/ui-react-shadcn`
- **内容**: shadcn React 组件、tailwind 配置、tsup 打包
- **依赖方**: `apps/desktop` (`package.json` 中依赖 `@dailyuse/ui-react-shadcn`)
- **操作步骤**:
  1. 删除整个 `packages/ui-react-shadcn/` 目录
  2. 从 `tsconfig.base.json` 中移除路径别名 `@dailyuse/ui-react-shadcn`
  3. 从 `apps/desktop/package.json` 中移除依赖（注意：Phase 4 才真正重写 renderer，此处先移除包，desktop 暂时编译会报错，可接受）

### 0.1.3 删除 `packages/ui-vuetify/`

- **路径**: `packages/ui-vuetify/`
- **原因**: 遗留 Vuetify 组件库，已完全被 shadcn-vue 替代
- **包名**: `@dailyuse/ui-vuetify`
- **内容**: Vuetify 组件封装、vite 配置
- **操作步骤**:
  1. 删除整个 `packages/ui-vuetify/` 目录
  2. 从 `tsconfig.base.json` 中移除路径别名 `@dailyuse/ui-vuetify`
  3. 确认无其他包依赖此包（当前应无依赖）

---

## 0.2 删除 Web 中遗留的 Vuetify 文件

### 0.2.1 删除旧 MainLayout

- **路径**: `apps/web/src/modules/app/MainLayout.vue`
- **原因**: 这是遗留的 Vuetify 版本 MainLayout，使用了 `PageSkeleton` 等 Vuetify 组件。当前实际使用的 MainLayout 位于 `apps/web/src/layouts/MainLayout.vue`（shadcn 版本）
- **操作**: 删除文件

### 0.2.2 删除旧 Sidebar 组件

- **路径**: `apps/web/src/modules/app/components/Sidebar.vue`
- **原因**: Vuetify Sidebar，引用了 `ProfileAvatar`、`SidebarMoreMenu`、`getNavigationRoutes()` 等，属于 dead code
- **操作**: 删除文件

### 0.2.3 删除旧 SidebarMoreMenu

- **路径**: `apps/web/src/modules/app/components/SidebarMoreMenu.vue`
- **原因**: Vuetify `v-menu` 下拉菜单组件，logout handler 已注释掉，属于 dead code
- **操作**: 删除文件

### 0.2.4 清理 app 模块目录

- 删除上述文件后，如果 `apps/web/src/modules/app/` 目录为空或仅剩 `components/` 空目录，删除整个 `app` 模块目录
- 更新 `apps/web/src/modules/` 下的 barrel export（如有）

---

## 0.3 删除标记为 `@deprecated` 的文件

### 0.3.1 Web 中的 deprecated 文件

| 文件路径 | 废弃原因 | 替代方案 | 操作 |
|---------|---------|---------|------|
| `apps/web/src/shared/http/httpClient.ts` | 旧的 HTTP 客户端 | `resultHttpClient` (来自 `@dailyuse/http-client`) | 检查是否仍有引用，如无则删除 |
| `apps/web/src/modules/notification/initialization/sseInitialization.ts` | SSE 连接已由 NotificationInitializationManager 管理 | `notificationInitialization.ts` | 检查是否被引用，如无则删除 |
| `apps/web/src/modules/task/initialization/taskInitialization.ts` | 旧初始化方式 | `registerTaskInitializationTasks` from `./index.ts` | 检查是否被引用，如无则删除 |

### 0.3.2 处理方法

对于每个 deprecated 文件：
1. 全局搜索引用（`grep -r "文件名" --include="*.ts" --include="*.vue"`）
2. 如果仍有引用，先将引用迁移到替代方案
3. 确认无引用后删除文件

---

## 0.4 修复 `WelcomeView.vue` 的 `currentUser` Bug

- **路径**: `apps/web/src/views/WelcomeView.vue`
- **现状分析**: 经代码审查，当前代码使用了安全的 optional chaining：
  ```typescript
  const userName = computed(() => {
    const currentUser = authStore.currentUser;
    return currentUser?.username || currentUser?.email || '用户';
  });
  ```
- **结论**: 该代码不存在空指针 bug，已使用安全访问。标记为 ✅ 无需修改
- **建议**: 如后续发现具体 bug 场景再针对修复

---

## 0.5 清理 console.log 调试残留

### 0.5.1 Web 应用中的 console.log（约 87 处）

按模块分布：

| 模块 | 数量 | 关键文件 |
|------|------|---------|
| `main.ts` | 2 | MSW 启动日志、App 启动日志 |
| `authentication` | 10 | `authenticationInitialization.ts` |
| `task` | 10 | `initialization/`、`registerTaskWidgets`、`TaskListView` |
| `goal` | 10 | `initialization/`、`registerGoalWidgets` |
| `reminder` | 10 | `reminderInitialization`、`registerReminderWidgets` |
| `notification` | 5 | `sseInitialization`、`notificationInitialization` |
| `schedule` | 6 | `scheduleInitialization`、`registerScheduleWidgets` |
| `setting` | 6 | `settingInitialization` |
| `account` | 5 | `accountInitialization` |
| `repository` | 3 | `repositoryInitialization`、`useMilkdown` |
| `editor` | 2 | `useMarkdownEditor` |
| `app` | 2 | `Sidebar`、`SidebarMoreMenu`（将在 0.2 中删除） |
| `governance` | 1 | `registerGovernanceWidgets` |
| `shared` | 1 | `httpClient.ts`（已在注释中） |

### 0.5.2 ui-vue-shadcn 包中的 console.log（6 处）

| 文件 | 数量 |
|------|------|
| `ObsidianEditor.vue` | 1 |
| `FileTree.vue` | 2 |
| `MediaViewer.vue` | 1 |
| `GoalDAGVisualization.vue` | 1 |
| `TaskInstanceCard.stories.ts` | 1 |

### 0.5.3 清理策略

1. **保留的 console.log**: 
   - `main.ts` 中的启动日志（`[Web] Application started`）可保留，但建议替换为统一日志工具
   - Storybook 的 stories 文件中的日志可保留
2. **删除的 console.log**: 
   - 所有 initialization 文件中的调试日志
   - 所有 composable/component 中的调试日志
   - 所有 widget 注册中的调试日志
3. **替代方案**: 建议使用 `@dailyuse/utils` 中的 logger（如已有），或在后续 Phase 中统一日志方案

---

## 0.6 更新构建配置

### 0.6.1 更新 `tsconfig.base.json`

移除以下路径别名：

```jsonc
// 删除以下路径映射
"@dailyuse/ui-react": ["packages/ui-react/src/index.ts"],
"@dailyuse/ui-react-shadcn": ["packages/ui-react-shadcn/src/index.ts"],
"@dailyuse/ui-vuetify": ["packages/ui-vuetify/src/index.ts"],
```

### 0.6.2 确认 `pnpm-workspace.yaml`

当前配置为 `packages: packages/*, apps/*`，使用通配符模式，删除包目录后自动排除，无需修改。

### 0.6.3 更新 `nx.json`（如需）

检查是否有针对已删除包的特殊配置（如 implicitDependencies），如有则移除。

---

## 0.7 验证步骤

完成所有清理后，执行以下验证：

```bash
# 1. 安装依赖（确保 lockfile 更新）
pnpm install

# 2. 编译 Web 应用
nx build web

# 3. 运行 Web 测试
nx test web

# 4. TypeScript 类型检查
pnpm typecheck

# 5. Lint 检查
pnpm lint

# 6. 确认没有引用已删除包的残留
grep -r "ui-react" --include="*.ts" --include="*.vue" --include="*.json" apps/ packages/
grep -r "ui-vuetify" --include="*.ts" --include="*.vue" --include="*.json" apps/ packages/
```

---

## 0.8 风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| 删除 ui-react-shadcn 后 desktop 无法编译 | Phase 0 专注于 Web 侧清理；desktop 编译在 Phase 4 之前暂时不作为验证目标 |
| 删除 deprecated 文件可能遗漏引用 | 对每个文件先做全局搜索，确保零引用后再删除 |
| console.log 清理可能删除有用的日志 | 保留启动日志和 error 日志，只删除 debug 级别的 console.log |
| pnpm lockfile 变更 | 删除包后运行 `pnpm install` 重新生成 lockfile |

---

## 检查清单

- [ ] 删除 `packages/ui-react/`
- [ ] 删除 `packages/ui-react-shadcn/`
- [ ] 删除 `packages/ui-vuetify/`
- [ ] 删除 `apps/web/src/modules/app/` 遗留 Vuetify 文件
- [ ] 删除 deprecated 文件（httpClient、sseInitialization、taskInitialization）
- [ ] 检查并修复 WelcomeView.vue（已确认无 bug）
- [ ] 清理 console.log 调试残留（~87+6 处）
- [ ] 更新 `tsconfig.base.json` 移除已删除包路径别名
- [ ] 确认 `pnpm-workspace.yaml`
- [ ] 运行 `nx build web` 验证
- [ ] 运行 `nx test web` 验证
- [ ] 全面 lint + typecheck 验证
