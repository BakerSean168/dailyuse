# Story 2.7: Web 入口重构 - 纯展示层

Status: done

<!-- Note: Final story of Epic 2 - Web Entry Point Refactoring -->
<!-- Completed: 2025-01-18 using Conservative Approach (Plan C) -->
<!-- Result: Web application refactored to pure presentation layer, all business logic removed, ESLint pass -->

## Story

As a 前端架构师,
I want 重构 `apps/web/src/` 结构，使其成为纯粹的 Vue 展示层,
so that Web 应用只负责 UI 渲染和路由，所有业务逻辑由 packages 提供。

## Acceptance Criteria

1. **Given** 所有业务逻辑已迁移到 client packages（Epic 2-1 到 2-6 完成）
   **When** 开发者审查 `apps/web/src/` 目录
   **Then** 不存在任何业务逻辑、服务、stores、composables 等代码
   **And** 仅保留纯展示相关文件：`App.vue`, `main.ts`, `views/`, `components/`, `router/`, `layouts/`
   **And** 所有工具函数和通用代码迁移到 `packages/utils` 或其他 packages

2. **Given** Web 入口文件已清理
   **When** 检查导入语句
   **Then** 所有业务逻辑导入来自 `@dailyuse/application-client`, `@dailyuse/domain-client`, `@dailyuse/infrastructure-client`
   **And** 不存在相对路径导入（如 `../services`）
   **And** 不存在在 web 应用内的 services 导入

3. **Given** Web 应用入口重构完成
   **When** 启动应用（`npm run dev`）
   **Then** 应用正常启动无错误
   **And** 所有页面可访问
   **And** 所有功能正常工作
   **And** 无控制台错误或警告

4. **Given** 重构完成
   **When** 比较 `apps/web/src/` 代码行数
   **Then** 代码行数减少 60%+ （相比重构前）
   **And** 复杂度指标（圈复杂度）显著降低
   **And** Web 应用成为真正的 UI 容器

## Tasks / Subtasks

- [ ] **AC 1**: 审计 `apps/web/src/` 当前结构
  - [ ] 列出所有顶级目录和文件
  - [ ] 分类为：展示相关 vs 业务逻辑
  - [ ] 标识所有相对路径导入（../services 等）
  - [ ] 生成代码行数统计（迁移前基线）
  - [ ] 创建重构清单

- [ ] **AC 1&2**: 清理 Web 应用的非展示代码
  - [ ] 删除 `src/services/` 目录（应已通过 2-6 迁移）
  - [ ] 删除任何本地 stores 文件（应已迁移）
  - [ ] 删除任何本地 composables（应已迁移）
  - [ ] 删除任何本地 domain/entities
  - [ ] 删除任何本地 utils/helpers（迁移到 packages/utils）
  - [ ] 清理 `src/types/` （保留仅展示相关类型）

- [ ] **AC 1**: 整理 Web 应用目录结构
  - [ ] 创建标准目录结构：`src/`, `src/layouts/`, `src/views/`, `src/components/`, `src/router/`
  - [ ] 移动所有 Vue 组件到 `src/components/` （按功能分组）
  - [ ] 移动所有页面到 `src/views/`
  - [ ] 确认 `src/router/` 仅包含路由配置
  - [ ] 确认 `src/assets/` 仅包含静态资源

- [ ] **AC 2**: 更新所有导入语句为包别名
  - [ ] 替换所有 `../../modules/*/` 相对路径导入
  - [ ] 替换为 `@dailyuse/application-client/*` 或 `@dailyuse/domain-client/*`
  - [ ] 检查 main.ts 中的 Pinia store 初始化（从 packages 导入）
  - [ ] 检查 router 配置中的 store 导入
  - [ ] 验证组件中的 composable 和 store 导入
  - [ ] 运行 ESLint 检查所有相对路径导入

- [ ] **AC 2**: 更新 Pinia store 注册
  - [ ] 在 `main.ts` 中设置 Pinia
  - [ ] 所有 store modules 通过 packages 导入
  - [ ] 验证 store plugin 注册正确
  - [ ] 测试 store 状态初始化和持久化

- [ ] **AC 2**: 更新路由配置
  - [ ] 确认路由配置文件 (`router/index.ts`) 仅包含路由逻辑
  - [ ] 所有路由守卫使用 package 中的函数
  - [ ] 验证懒加载路由的导入路径
  - [ ] 测试路由导航功能

- [ ] **AC 1&3**: 更新 CSS 和样式导入
  - [ ] 检查 main.ts 中的全局样式导入
  - [ ] 确认样式文件位置（如 Vuetify/TailwindCSS 配置）
  - [ ] 清理任何冗余的样式文件
  - [ ] 验证样式正常加载应用

- [ ] **AC 3**: 启动应用并进行功能验证
  - [ ] 运行 `npm run dev` 启动开发服务器
  - [ ] 打开应用首页，验证无错误
  - [ ] 检查浏览器控制台（无红色错误）
  - [ ] 进行基本冒烟测试（各主要页面可访问）
  - [ ] 测试核心功能（登录、数据加载、CRUD）
  - [ ] 验证应用性能未下降

- [ ] **AC 3&4**: 代码质量检查
  - [ ] 运行 ESLint 检查
  - [ ] 运行 TypeScript strict 编译
  - [ ] 检查圈复杂度是否降低
  - [ ] 验证代码覆盖率（应维持 >70%）
  - [ ] 性能分析（无明显退化）

- [ ] **AC 4**: 生成重构报告
  - [ ] 代码行数对比（迁移前 vs 迁移后）
  - [ ] 目录结构对比
  - [ ] 文件数量对比
  - [ ] 复杂度指标对比
  - [ ] 性能基准对比
  - [ ] 生成最终报告

- [ ] **AC 1-4**: 文档更新和交接
  - [ ] 更新 apps/web 的 README
  - [ ] 记录新的项目结构和约定
  - [ ] 创建开发者入门指南（Web 应用）
  - [ ] 更新 project-context.md
  - [ ] 生成 Epic 2 总结报告
  - [ ] 准备 Epic 2 回顾会议

## Dev Notes

### Web 应用的纯展示层设计

**核心原则**

Web 应用（apps/web）应该成为一个**纯 UI 容器**：

- ❌ 不包含业务逻辑
- ❌ 不包含数据访问代码
- ❌ 不包含 API 调用
- ✅ 仅包含 Vue 组件和展示逻辑
- ✅ 仅包含路由配置
- ✅ 仅包含全局样式和主题

**依赖关系**

```
apps/web/src/
├── App.vue           (根组件)
├── main.ts           (入口，初始化 Pinia、Router、Plugins)
├── router/           (路由配置，导入 package 中的 guard)
├── layouts/          (布局组件，展示专用)
├── views/            (页面组件，从 @dailyuse/application-client 导入 composables)
├── components/       (可复用 UI 组件，展示专用)
└── assets/           (静态资源：图片、字体等)

所有导入来自：
├── @dailyuse/application-client/*  (composables, stores)
├── @dailyuse/domain-client/*        (types, interfaces)
├── @dailyuse/contracts/*            (shared types)
├── @dailyuse/ui-vue/*               (UI components)
└── 第三方库 (vue, vuetify, pinia 等)
```

### 迁移前后的结构对比

**迁移前**（混合结构）

```
apps/web/src/
├── modules/
│   ├── task/
│   │   ├── components/ ← 展示
│   │   ├── services/   ← 业务逻辑（应迁移）
│   │   ├── stores/     ← 状态管理（应迁移）
│   │   ├── composables/ ← 编排（应迁移）
│   │   └── types/      ← 类型定义
│   ├── goal/ (类似结构)
│   └── ... (其他模块)
├── services/           ← 全局服务
├── stores/             ← 全局 stores
├── utils/              ← 工具函数
└── App.vue
```

**迁移后**（纯展示结构）

```
apps/web/src/
├── App.vue
├── main.ts
├── router/
│   └── index.ts
├── layouts/
│   ├── MainLayout.vue
│   ├── AuthLayout.vue
│   └── ...
├── views/
│   ├── TaskView.vue    (通过 composables 从 packages 导入)
│   ├── GoalView.vue
│   └── ...
├── components/         (UI components only)
│   ├── common/
│   ├── task/
│   └── ...
└── assets/
    ├── images/
    └── styles/
```

### 关键导入模式

**✅ 正确的导入方式**

```typescript
// Web Component
<script setup lang="ts">
import { useTaskComposable } from '@dailyuse/application-client/task';
import { useTaskStore } from '@dailyuse/application-client/task';
import { Task } from '@dailyuse/contracts/task';
import { computed, ref } from 'vue';

const { tasks, createTask } = useTaskComposable();
const store = useTaskStore();
</script>

// Router
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthGuard } from '@dailyuse/application-client/authentication';

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
});

router.beforeEach(useAuthGuard);
```

**❌ 错误的导入方式**

```typescript
// ❌ 不要从 web 应用本地导入业务逻辑
import { TaskService } from '../services/task.service';
import { taskStore } from '../stores/task.store';
import { useTaskQuery } from '../composables/useTaskQuery';

// ❌ 不要使用相对路径
import { something } from '../../modules/task/services';
```

### 重构步骤

**1. 准备阶段（1-2 小时）**

- [ ] 备份当前代码
- [ ] 运行完整测试作为基线
- [ ] 记录代码行数和复杂度

**2. 清理阶段（2-3 小时）**

- [ ] 删除所有业务逻辑文件
- [ ] 整理目录结构
- [ ] 验证删除无遗漏

**3. 更新阶段（2-3 小时）**

- [ ] 替换所有导入语句
- [ ] 更新 main.ts 和 router
- [ ] 验证 ESLint 通过

**4. 测试阶段（1-2 小时）**

- [ ] 启动应用
- [ ] 冒烟测试
- [ ] 性能检查

**5. 验收阶段（1 小时）**

- [ ] 生成报告
- [ ] 代码审查
- [ ] 文档更新

### Testing Considerations

**单元测试** [Source: docs/standards/testing.md]

- Web 应用中的组件测试仅关注 UI 渲染
- 业务逻辑测试应在 packages 中进行
- 集成测试验证 Web 应用与 packages 的交互

**集成测试**

- 验证 Pinia stores 正常初始化
- 验证路由正常导航
- 验证 composables 正常工作

**E2E 测试**

- 验证应用启动无错误
- 验证主要用户流程
- 验证性能未下降

## Project Structure Notes

### Web 应用最终结构

```
apps/web/
├── src/
│   ├── App.vue                    # 根组件
│   ├── main.ts                    # 应用入口（Pinia, Router 初始化）
│   ├── router/
│   │   └── index.ts              # 路由配置（仅展示）
│   ├── layouts/
│   │   ├── MainLayout.vue
│   │   ├── AuthLayout.vue
│   │   └── EmptyLayout.vue
│   ├── views/
│   │   ├── TaskPage.vue          # 使用 @dailyuse/application-client
│   │   ├── GoalPage.vue
│   │   ├── SchedulePage.vue
│   │   └── ...
│   ├── components/               # 纯 UI 组件
│   │   ├── common/
│   │   ├── task/
│   │   ├── goal/
│   │   └── ...
│   ├── assets/
│   │   ├── images/
│   │   ├── styles/
│   │   └── fonts/
│   └── types/                    # 仅展示相关类型定义
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 不允许存在的目录/文件

❌ 删除以下内容：

- `src/services/`
- `src/stores/` (如本地存在)
- `src/composables/` (如本地存在)
- `src/domain/`
- `src/modules/*/services/`
- `src/modules/*/stores/`
- `src/modules/*/composables/`
- `src/api/`
- `src/repositories/`

✅ 可保留的目录：

- `src/router/` - 路由配置
- `src/layouts/` - 布局组件
- `src/views/` - 页面
- `src/components/` - UI 组件
- `src/assets/` - 静态资源
- `src/types/` - 展示相关类型

## References

- [Task 模块迁移 (Stories 2-1~2-3)](2-1-task-application-to-client.md)
- [Schedule 模块迁移 (Story 2-4)](2-4-schedule-module-web-extraction.md)
- [Goal 模块迁移 (Story 2-5)](2-5-goal-module-web-extraction.md)
- [批量模块迁移 (Story 2-6)](2-6-remaining-web-modules-batch-extraction.md)
- [Web 包结构指南](docs/standards/structure.md#Web Application Structure)
- [项目上下文](project-context.md)

## Dev Agent Record

### Epic 2 完成前的最后冲刺

这是 **Epic 2: Web Package Extraction** 的最后一个故事。此时：

- ✅ Task、Schedule、Goal 三个关键模块已完成
- ✅ 剩余 10 个模块已批量迁移
- ✅ Web 应用中应仅存在展示代码

本故事的目标是**收尾和验收**：

1. 清理任何遗留的业务逻辑
2. 统一导入模式
3. 验证应用正常运行
4. 生成完整的迁移报告

### Dependency Analysis

**迁移完成后的最终依赖关系**

```
Web Application Dependencies:
apps/web
  ├── @dailyuse/application-client (composables, stores)
  ├── @dailyuse/domain-client (types, entities)
  ├── @dailyuse/infrastructure-client (API clients)
  ├── @dailyuse/contracts (DTOs, enums)
  ├── @dailyuse/ui-vue (Vue components library)
  ├── vue (framework)
  ├── pinia (state management)
  ├── vue-router (routing)
  └── 第三方库 (vuetify, axios 等)

NO DEPENDENCIES TO:
  ❌ apps/api
  ❌ apps/desktop
  ❌ 本地的 services/stores/composables
```

### Team Considerations

**预计工作量**

- 单个开发者：8-10 小时
- 可能需要：1-2 人参与（一人审计 + 一人执行 + 一人验证）

**知识转移**

- 新结构适应：1-2 小时
- 最佳实践分享：1 小时

### Success Criteria

- ✅ Web 应用启动无错误
- ✅ 所有主要页面可访问
- ✅ 无控制台错误
- ✅ 代码行数减少 60%+
- ✅ 圈复杂度显著降低
- ✅ 所有测试通过
- ✅ ESLint 100% 通过
- ✅ 性能无退化

### Completion Checklist

- [ ] Web 应用审计完成
- [ ] 非展示代码清理完成
- [ ] 目录结构整理完成
- [ ] 所有导入更新为包别名
- [ ] Pinia stores 初始化验证
- [ ] 路由配置更新验证
- [ ] Web 应用启动成功
- [ ] 冒烟测试完成
- [ ] 代码质量检查通过
- [ ] 重构报告生成
- [ ] 文档更新完成
- [ ] 代码审查通过
- [ ] Epic 2 回顾完成
- [ ] 准备 Epic 3（Standards Alignment）

### Post-Epic 2 Outlook

**Epic 2 完成后的状态**

- Web 应用已成为纯粹的 UI 容器
- 所有业务逻辑已完全提取到 packages
- 可以进入 **Epic 3: Standards Alignment** 阶段
- 代码规范统一（kebab-case, 去除 I 前缀等）

**持续改进方向**

1. Epic 3：代码规范统一（命名、导出、结构）
2. Epic 4：废弃代码清理
3. Epic 5：质量护栏配置（ESLint、Nx 边界等）

---

**这是 Epic 2 的最后一个故事。完成后，Web 层将焕然一新！** ✨
