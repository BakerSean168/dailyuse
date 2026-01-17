---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/PRD-Codebase-Refactor.md
  - docs/architecture/package-implementation-guide.md
  - docs/standards/structure.md
  - docs/standards/naming.md
  - docs/source-code-scan-findings.md
project_name: dailyuse
workflowType: create-epics-and-stories
user_name: Baker
date: '2026-01-17'
status: 'COMPLETE - Ready for Development'
---

# dailyuse - Codebase Refactor Epic Breakdown

## Overview

本文档包含 DailyUse 代码架构重构的完整 Epic 和 Story 分解，目标是将 API 和 Web 应用完全拆分到 packages，统一代码规范，并清理废弃代码。

## Requirements Inventory

### Functional Requirements

- **FR-001**: 将 `apps/api/src/modules/*/domain/` 迁移到 `packages/domain-server/*/`
- **FR-002**: 将 `apps/api/src/modules/*/application/` 迁移到 `packages/application-server/*/`
- **FR-003**: 将 `apps/api/src/modules/*/infrastructure/` 迁移到 `packages/infrastructure-server/*/`
- **FR-004**: `apps/api/src/modules/*/interface/` 保留并重构为纯 Controllers/Routes
- **FR-005**: 将 `apps/web/src/modules/*/application/` 迁移到 `packages/application-client/*/`
- **FR-006**: 将 `apps/web/src/modules/*/infrastructure/` 迁移到 `packages/infrastructure-client/*/`
- **FR-007**: 将 `apps/web/src/modules/*/services/` 按职责拆分
- **FR-008**: `apps/web/src/modules/*/presentation/` 保留为 Vue 组件
- **FR-009**: 所有 `.ts` 文件名使用 kebab-case
- **FR-010**: 接口命名去除 "I" 前缀
- **FR-011**: 使用 Named Export 替换 Default Export
- **FR-012**: 文件夹结构对齐 package-implementation-guide.md
- **FR-013**: 移除所有 `@deprecated` 标记的代码
- **FR-014**: 移除所有 backward compatibility 分支
- **FR-015**: 移除旧的 urgency/priority 兼容逻辑
- **FR-016**: 配置 Nx `enforce-module-boundaries` 规则
- **FR-017**: 配置 ESLint 命名规范规则
- **FR-018**: 配置 Import 限制规则

### NonFunctional Requirements

- **NFR-001**: 重构期间保持所有现有测试通过
- **NFR-002**: 重构完成后，apps 目录代码量减少 70%+
- **NFR-003**: 所有 packages 可独立编译和测试

### FR Coverage Map

- **Epic 1 (API Package Extraction):** FR-001, FR-002, FR-003, FR-004
- **Epic 2 (Web Package Extraction):** FR-005, FR-006, FR-007, FR-008
- **Epic 3 (Standards Alignment):** FR-009, FR-010, FR-011, FR-012
- **Epic 4 (Deprecation Cleanup):** FR-013, FR-014, FR-015
- **Epic 5 (Quality Gates):** FR-016, FR-017, FR-018

## Epic List

1. **API Package Extraction:** 将 API 模块的 domain/application/infrastructure 层迁移到 packages
2. **Web Package Extraction:** 将 Web 模块的 application/infrastructure/services 层迁移到 packages
3. **Standards Alignment:** 统一代码规范、命名、文件结构
4. **Deprecation Cleanup:** 移除废弃代码和兼容性分支
5. **Quality Gates:** 建立自动化架构护栏

---

## Epic 1: API Package Extraction

**Goal:** 将 `apps/api/src/modules/*` 中的 domain/application/infrastructure 层完整迁移到对应 packages，使 apps/api 成为纯粹的入口容器。

**Requirements Covered:** FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-003

**涉及模块 (14 个):** account, ai, authentication, dashboard, editor, goal, metrics, notification, reminder, repository, schedule, setting, system, task

### Story 1.1: Task 模块拆分 - Domain 层迁移

As a 后端架构师,
I want 将 `apps/api/src/modules/task/domain/` 迁移到 `packages/domain-server/src/task/`,
So that Task 领域逻辑可在 API 和 Desktop 间复用。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/task/domain/` 目录存在
**When** 开发者执行迁移
**Then** 所有 domain 文件移动到 `packages/domain-server/src/task/`
**And** 更新 `packages/domain-server/src/index.ts` 导出新模块
**And** `apps/api/src/modules/task/` 改为从 `@dailyuse/domain-server` 导入
**And** 现有测试全部通过
**And** 无循环依赖

### Story 1.2: Task 模块拆分 - Application 层迁移

As a 后端架构师,
I want 将 `apps/api/src/modules/task/application/` 迁移到 `packages/application-server/src/task/`,
So that Task 用例逻辑可被多个入口复用。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/task/application/` 目录存在
**When** 开发者执行迁移
**Then** 所有 application 文件移动到 `packages/application-server/src/task/`
**And** 更新 `packages/application-server/src/index.ts` 导出新模块
**And** 依赖的 domain 类型改为从 `@dailyuse/domain-server` 导入
**And** `apps/api/src/modules/task/` 改为从 `@dailyuse/application-server` 导入
**And** 现有测试全部通过

### Story 1.3: Task 模块拆分 - Infrastructure 层迁移

As a 后端架构师,
I want 将 `apps/api/src/modules/task/infrastructure/` 迁移到 `packages/infrastructure-server/src/task/`,
So that Task 数据访问层可被独立测试和替换。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/task/infrastructure/` 目录存在
**When** 开发者执行迁移
**Then** 所有 infrastructure 文件移动到 `packages/infrastructure-server/src/task/`
**And** 实现 domain 层定义的 Repository 接口
**And** 更新 `packages/infrastructure-server/src/index.ts` 导出新模块
**And** `apps/api/` 仅保留 interface 层（Controllers/Routes）
**And** 现有测试全部通过

### Story 1.4: Schedule 模块完整拆分

As a 后端架构师,
I want 将 `apps/api/src/modules/schedule/` 的 domain/application/infrastructure 完整迁移到对应 packages,
So that Schedule 模块遵循统一的拆分模式。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/schedule/` 包含完整分层
**When** 开发者执行迁移
**Then** `domain/` → `packages/domain-server/src/schedule/`
**And** `application/` → `packages/application-server/src/schedule/`
**And** `infrastructure/` → `packages/infrastructure-server/src/schedule/`
**And** `interface/` 保留在 `apps/api/src/modules/schedule/`
**And** 所有导入路径更新为 package 别名
**And** 现有测试全部通过

### Story 1.5: Goal 模块完整拆分

As a 后端架构师,
I want 将 `apps/api/src/modules/goal/` 的 domain/application/infrastructure 完整迁移到对应 packages,
So that Goal 模块遵循统一的拆分模式。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/goal/` 包含完整分层
**When** 开发者执行迁移
**Then** `domain/` → `packages/domain-server/src/goal/`
**And** `application/` → `packages/application-server/src/goal/`
**And** `infrastructure/` → `packages/infrastructure-server/src/goal/`
**And** `interface/` 保留在 `apps/api/src/modules/goal/`
**And** 现有测试全部通过

### Story 1.6: Authentication 模块完整拆分

As a 后端架构师,
I want 将 `apps/api/src/modules/authentication/` 完整迁移到对应 packages,
So that 认证逻辑可跨 API/Desktop 复用。

**Acceptance Criteria:**

**Given** `apps/api/src/modules/authentication/` 包含完整分层
**When** 开发者执行迁移
**Then** 分层代码迁移到对应 packages
**And** 保留 Controllers/Middleware 在 apps/api
**And** 现有测试全部通过

### Story 1.7: 剩余模块批量拆分 (account, ai, dashboard, editor, metrics, notification, reminder, repository, setting, system)

As a 后端架构师,
I want 将剩余 10 个 API 模块的分层代码批量迁移到 packages,
So that 整个 API 层完成拆分。

**Acceptance Criteria:**

**Given** 剩余 10 个模块: account, ai, dashboard, editor, metrics, notification, reminder, repository, setting, system
**When** 开发者按模板执行批量迁移
**Then** 每个模块的 domain/application/infrastructure 迁移到对应 packages
**And** apps/api/src/modules/ 仅保留 interface 层
**And** 所有模块测试通过
**And** API 应用可正常启动和运行

### Story 1.8: API 入口重构 - 纯容器化

As a 后端架构师,
I want 重构 `apps/api/src/app.ts` 和路由配置，使其成为纯粹的组装入口,
So that API 应用只负责 wiring 和启动。

**Acceptance Criteria:**

**Given** 所有业务逻辑已迁移到 packages
**When** 开发者重构入口文件
**Then** `apps/api/src/` 仅包含：`app.ts`, `index.ts`, `controllers/`, `routes/`, `middleware/`
**And** 删除 `apps/api/src/modules/` 中的所有 domain/application/infrastructure 目录
**And** 所有依赖通过 DI 注入或直接从 packages 导入
**And** API 启动正常，所有端点可用
**And** 代码行数减少 70%+

---

## Epic 2: Web Package Extraction

**Goal:** 将 `apps/web/src/modules/*` 中的 application/infrastructure/services 层迁移到对应 client packages，使 apps/web 成为纯 Vue 展示层。

**Requirements Covered:** FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-003

**涉及模块 (13 个):** account, ai, app, authentication, dashboard, editor, goal, notification, reminder, repository, schedule, setting, task

### Story 2.1: Task 模块拆分 - Application 层迁移到 Client

As a 前端架构师,
I want 将 `apps/web/src/modules/task/application/` 迁移到 `packages/application-client/src/task/`,
So that Task 前端用例逻辑可在 Web 和未来移动端间复用。

**Acceptance Criteria:**

**Given** `apps/web/src/modules/task/application/` 目录存在
**When** 开发者执行迁移
**Then** 所有 application 文件移动到 `packages/application-client/src/task/`
**And** 更新 `packages/application-client/src/index.ts` 导出新模块
**And** `apps/web/src/modules/task/` 改为从 `@dailyuse/application-client` 导入
**And** 现有测试全部通过

### Story 2.2: Task 模块拆分 - Infrastructure 层迁移到 Client

As a 前端架构师,
I want 将 `apps/web/src/modules/task/infrastructure/` 迁移到 `packages/infrastructure-client/src/task/`,
So that Task HTTP/API 调用逻辑可被统一管理和测试。

**Acceptance Criteria:**

**Given** `apps/web/src/modules/task/infrastructure/` 目录存在
**When** 开发者执行迁移
**Then** 所有 infrastructure 文件移动到 `packages/infrastructure-client/src/task/`
**And** 更新导出和导入路径
**And** 现有测试全部通过

### Story 2.3: Task 模块拆分 - Services 层分类迁移

As a 前端架构师,
I want 将 `apps/web/src/modules/task/services/` 按职责拆分到 domain-client 或 application-client,
So that 服务层职责清晰。

**Acceptance Criteria:**

**Given** `apps/web/src/modules/task/services/` 目录存在
**When** 开发者分析每个 service 的职责
**Then** 业务规则类 service → `packages/domain-client/src/task/`
**And** 编排类 service → `packages/application-client/src/task/`
**And** `apps/web/src/modules/task/` 仅保留 presentation 组件
**And** 现有测试全部通过

### Story 2.4: Schedule 模块完整拆分 (Web)

As a 前端架构师,
I want 将 `apps/web/src/modules/schedule/` 的 application/infrastructure/services 完整迁移,
So that Schedule 前端逻辑可复用。

**Acceptance Criteria:**

**Given** `apps/web/src/modules/schedule/` 包含非 presentation 代码
**When** 开发者执行迁移
**Then** 非 presentation 代码迁移到对应 client packages
**And** `apps/web/src/modules/schedule/` 仅保留 Vue 组件
**And** 现有测试全部通过

### Story 2.5: Goal 模块完整拆分 (Web)

As a 前端架构师,
I want 将 `apps/web/src/modules/goal/` 的 application/infrastructure/services 完整迁移,
So that Goal 前端逻辑可复用。

**Acceptance Criteria:**

**Given** `apps/web/src/modules/goal/` 包含非 presentation 代码
**When** 开发者执行迁移
**Then** 非 presentation 代码迁移到对应 client packages
**And** 现有测试全部通过

### Story 2.6: 剩余模块批量拆分 (account, ai, app, authentication, dashboard, editor, notification, reminder, repository, setting)

As a 前端架构师,
I want 将剩余 10 个 Web 模块的非 presentation 代码批量迁移到 packages,
So that 整个 Web 层完成拆分。

**Acceptance Criteria:**

**Given** 剩余 10 个模块存在非 presentation 代码
**When** 开发者按模板执行批量迁移
**Then** 每个模块的 application/infrastructure/services 迁移到对应 client packages
**And** apps/web/src/modules/ 仅保留 Vue 组件和视图
**And** 所有模块测试通过
**And** Web 应用可正常启动和运行

### Story 2.7: Web 入口重构 - 纯展示层

As a 前端架构师,
I want 重构 `apps/web/src/` 结构，使其成为纯粹的 Vue 展示层,
So that Web 应用只负责 UI 渲染和路由。

**Acceptance Criteria:**

**Given** 所有业务逻辑已迁移到 client packages
**When** 开发者重构入口结构
**Then** `apps/web/src/` 仅包含：`App.vue`, `main.ts`, `views/`, `components/`, `router/`, `stores/`
**And** 所有业务逻辑通过 composables 或 stores 从 packages 导入
**And** Web 应用启动正常，所有页面可用
**And** 代码行数减少 60%+

---

## Epic 3: Standards Alignment

**Goal:** 按照 `docs/standards/naming.md` 和 `docs/standards/structure.md` 统一所有包的命名、导出、文件结构。

**Requirements Covered:** FR-009, FR-010, FR-011, FR-012

### Story 3.1: 文件名 kebab-case 统一

As a 代码规范执行者,
I want 将所有 `.ts/.tsx` 文件名统一为 kebab-case,
So that 文件命名风格一致。

**Acceptance Criteria:**

**Given** 存在 PascalCase 或其他风格的文件名（如 `UserService.ts`）
**When** 开发者执行批量重命名
**Then** 所有文件名改为 kebab-case（如 `user-service.ts`）
**And** 所有 import 路径同步更新
**And** Git 历史保留（使用 git mv）
**And** 编译和测试全部通过

### Story 3.2: 接口命名去除 "I" 前缀

As a 代码规范执行者,
I want 将所有接口命名去除 "I" 前缀,
So that 接口命名符合 TypeScript 最佳实践。

**Acceptance Criteria:**

**Given** 存在 `ITaskRepository`, `IUserService` 等命名
**When** 开发者执行批量重命名
**Then** 所有接口改为 `TaskRepository`, `UserService`
**And** 所有使用处同步更新
**And** 编译和测试全部通过

### Story 3.3: Named Export 替换 Default Export

As a 代码规范执行者,
I want 将所有 default export 改为 named export,
So that 导出风格统一，import 更加明确。

**Acceptance Criteria:**

**Given** 存在 `export default class UserService {}` 的代码
**When** 开发者执行批量替换
**Then** 改为 `export class UserService {}`
**And** 所有 import 改为 `import { UserService } from '...'`
**And** 编译和测试全部通过

### Story 3.4: 文件夹结构对齐 package-implementation-guide.md

As a 代码规范执行者,
I want 确保所有 packages 的内部结构对齐 `package-implementation-guide.md` 规范,
So that 目录结构统一可预测。

**Acceptance Criteria:**

**Given** `package-implementation-guide.md` 定义了标准结构
**When** 开发者检查并调整各 package
**Then** 每个 package 遵循：`src/{module}/aggregates/`, `src/{module}/services/`, `src/{module}/errors/`, `src/{module}/repositories/` 等结构
**And** 每个 module 有独立的 `index.ts` 导出
**And** 根 `index.ts` 聚合所有模块导出

---

## Epic 4: Deprecation Cleanup

**Goal:** 移除所有废弃代码、@deprecated 标记、backward compatibility 分支，清理技术债。

**Requirements Covered:** FR-013, FR-014, FR-015

### Story 4.1: 移除 @deprecated 标记代码

As a 代码清洁执行者,
I want 搜索并移除所有 @deprecated 标记的函数、类、方法,
So that 代码库不包含已废弃的实现。

**Acceptance Criteria:**

**Given** 代码中存在 `@deprecated` 注释或装饰器
**When** 开发者执行清理
**Then** 所有 @deprecated 代码被删除
**And** 所有依赖这些代码的调用点更新为新实现
**And** 编译和测试全部通过

### Story 4.2: 移除 backward compatibility 分支

As a 代码清洁执行者,
I want 移除所有 "backward compatibility" 相关的条件分支和适配代码,
So that 代码路径更简洁。

**Acceptance Criteria:**

**Given** 代码中存在 `// for backward compatibility`, `// compat`, `// legacy` 等注释
**When** 开发者执行清理
**Then** 相关分支代码被删除
**And** 仅保留新的实现路径
**And** 编译和测试全部通过

### Story 4.3: 移除旧的 urgency/priority 兼容逻辑

As a 代码清洁执行者,
I want 移除 Priority Refactor 遗留的 urgency 字段和旧 priority 兼容逻辑,
So that 任务模型完全遵循新设计。

**Acceptance Criteria:**

**Given** Task 模块仍有 urgency 字段处理或 priority 兼容代码
**When** 开发者执行清理
**Then** 所有 urgency 相关代码删除
**And** priority 仅作为计算字段存在
**And** 数据库 Schema 更新（删除 urgency 列如有）
**And** API 和前端代码同步更新
**And** 编译和测试全部通过

### Story 4.4: 清理未使用的依赖和文件

As a 代码清洁执行者,
I want 识别并移除所有未使用的 npm 依赖和孤立文件,
So that 代码库更精简。

**Acceptance Criteria:**

**Given** 存在未被引用的依赖或文件
**When** 开发者使用工具扫描（如 depcheck, ts-prune）
**Then** 移除未使用的 dependencies 和 devDependencies
**And** 删除孤立的源文件
**And** 应用正常运行

---

## Epic 5: Quality Gates

**Goal:** 建立自动化架构护栏，防止未来违反分层约束和代码规范。

**Requirements Covered:** FR-016, FR-017, FR-018, NFR-001

### Story 5.1: 配置 Nx enforce-module-boundaries 规则

As a 架构守护者,
I want 在 `nx.json` 中配置 `enforce-module-boundaries` 规则,
So that 违反分层依赖的代码在编译时报错。

**Acceptance Criteria:**

**Given** Nx monorepo 已配置
**When** 开发者配置 module boundaries
**Then** 定义 project tags：`scope:domain`, `scope:application`, `scope:infrastructure`, `scope:app`
**And** 规则：`scope:domain` 不能依赖 `scope:infrastructure` 或 `scope:app`
**And** 规则：`scope:infrastructure` 不能依赖 `scope:app`
**And** `nx lint` 验证规则生效
**And** CI pipeline 包含此检查

### Story 5.2: 配置 ESLint 命名规范规则

As a 架构守护者,
I want 配置 ESLint 规则强制 kebab-case 文件名和 camelCase 变量名,
So that 命名规范自动检查。

**Acceptance Criteria:**

**Given** ESLint 已配置
**When** 开发者添加命名规则
**Then** 使用 `@typescript-eslint/naming-convention` 规则
**And** 文件名规则使用 `eslint-plugin-filenames` 或类似插件
**And** 违规代码在 lint 时报错
**And** CI pipeline 包含此检查

### Story 5.3: 配置 Import 限制规则

As a 架构守护者,
I want 配置 ESLint `no-restricted-imports` 规则禁止非法导入,
So that domain 层不能直接导入 infrastructure。

**Acceptance Criteria:**

**Given** ESLint 已配置
**When** 开发者添加 import 限制
**Then** `packages/domain-*` 不能 import `packages/infrastructure-*`
**And** `packages/domain-*` 不能 import `prisma`, `axios` 等基础设施库
**And** `apps/*` 不能直接 import `packages/domain-*` 的内部文件（只能通过 index）
**And** 违规 import 在 lint 时报错

### Story 5.4: 添加 Pre-commit Hooks

As a 架构守护者,
I want 配置 husky + lint-staged 在提交前自动检查,
So that 违规代码无法提交。

**Acceptance Criteria:**

**Given** 项目使用 Git
**When** 开发者配置 pre-commit hooks
**Then** `pnpm husky install` 已配置
**And** `lint-staged` 在 staged 文件上运行 lint
**And** 提交包含违规代码时阻止 commit
**And** 配置文档更新

### Story 5.5: CI Pipeline 架构检查集成

As a 架构守护者,
I want 在 CI pipeline 中添加架构检查步骤,
So that PR 合并前自动验证架构约束。

**Acceptance Criteria:**

**Given** CI/CD pipeline 已配置
**When** 开发者添加检查步骤
**Then** PR 触发：`nx affected:lint`, `nx affected:test`
**And** module boundaries 检查作为 blocking step
**And** 检查失败时 PR 无法合并
**And** 检查结果在 PR 页面可见
