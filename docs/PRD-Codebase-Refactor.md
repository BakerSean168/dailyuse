# PRD: 代码架构重构 (Codebase Architecture Refactor)

| 属性 | 内容 |
| :--- | :--- |
| **文档状态** | Approved |
| **负责人** | John (PM) |
| **创建日期** | 2026-01-17 |
| **参与者** | Baker, Winston, Amelia, Mary |

## 1. 背景与目标 (Background & Goals)

### 1.1 问题陈述

当前项目存在以下架构问题：

1. **拆分不完全**：`apps/api` 和 `apps/web` 内部仍包含完整的分层代码（domain/application/infrastructure），未按 Nx monorepo 思想将逻辑抽取到 packages。
2. **代码规范不统一**：命名风格（PascalCase/kebab-case/camelCase）混用，文件结构不符合 `docs/standards/` 规范。
3. **兼容性代码累积**：历史迭代遗留的 backward compatibility 代码、@deprecated 标记未清理。
4. **Apps 非纯容器**：应用入口包含业务逻辑，违反"Apps 只是组装层"原则。

### 1.2 产品目标

1. **完全拆分**：将 API 和 Web 的业务逻辑 100% 迁移到 packages，apps 仅保留入口和 presentation 层。
2. **规范统一**：所有代码遵循 `docs/standards/naming.md` 和 `docs/standards/structure.md`。
3. **代码清洁**：移除所有废弃/兼容性代码，减少技术债。
4. **架构护栏**：建立自动化规则防止未来违规。

### 1.3 约束条件

- ✅ **开发阶段**：允许 Breaking Changes，无需兼容旧数据。
- ✅ **无生产部署**：不需要迁移脚本或灰度策略。
- ✅ **完全重构**：可以彻底重命名/移动/删除。

## 2. 现状分析 (Current State)

### 2.1 项目结构

```
apps/
├── api/src/modules/          # ❌ 包含 domain/application/infrastructure/interface
│   ├── task/
│   ├── schedule/
│   └── ... (14 个模块)
├── web/src/modules/          # ❌ 包含 application/infrastructure/presentation/services
│   ├── task/
│   ├── schedule/
│   └── ... (13 个模块)
└── desktop/                  # ✅ 已部分拆分，使用 packages

packages/
├── contracts/                # ✅ 已建立，模块化结构
├── domain-server/            # ⚠️ 部分模块已拆分
├── application-server/       # ⚠️ 部分模块已拆分
├── infrastructure-server/    # ⚠️ 部分模块已拆分
├── domain-client/            # ❓ 需评估
├── application-client/       # ❓ 需评估
├── infrastructure-client/    # ❓ 需评估
└── ui-*/                     # ✅ UI 组件库
```

### 2.2 目标结构

```
apps/
├── api/src/                  # ✅ 仅 Controllers/Routes/Middleware
│   ├── controllers/
│   ├── routes/
│   └── app.ts
├── web/src/                  # ✅ 仅 Vue Components/Views/Router
│   ├── views/
│   ├── components/
│   └── App.vue
└── desktop/                  # ✅ 仅 Electron Main/Renderer 入口

packages/
├── contracts/                # L1: 所有共享类型
├── domain-server/            # L2: 后端业务规则
├── domain-client/            # L2: 前端业务规则
├── application-server/       # L4: 后端用例编排
├── application-client/       # L4: 前端用例编排
├── infrastructure-server/    # L3: 后端基础设施
├── infrastructure-client/    # L3: 前端基础设施
└── ui-*/                     # Presentation 组件
```

## 3. 功能需求 (Functional Requirements)

### 3.1 API 模块拆分

- **FR-001**: 将 `apps/api/src/modules/*/domain/` 迁移到 `packages/domain-server/*/`
- **FR-002**: 将 `apps/api/src/modules/*/application/` 迁移到 `packages/application-server/*/`
- **FR-003**: 将 `apps/api/src/modules/*/infrastructure/` 迁移到 `packages/infrastructure-server/*/`
- **FR-004**: `apps/api/src/modules/*/interface/` 保留，重命名为 `controllers/` 或 `routes/`

### 3.2 Web 模块拆分

- **FR-005**: 将 `apps/web/src/modules/*/application/` 迁移到 `packages/application-client/*/`
- **FR-006**: 将 `apps/web/src/modules/*/infrastructure/` 迁移到 `packages/infrastructure-client/*/`
- **FR-007**: 将 `apps/web/src/modules/*/services/` 按职责拆分到 domain-client 或 application-client
- **FR-008**: `apps/web/src/modules/*/presentation/` 保留为 Vue 组件

### 3.3 代码规范统一

- **FR-009**: 所有 `.ts` 文件名使用 kebab-case
- **FR-010**: 接口命名去除 "I" 前缀（`ITaskRepository` → `TaskRepository`）
- **FR-011**: 使用 Named Export 替换 Default Export
- **FR-012**: 文件夹结构对齐 `package-implementation-guide.md`

### 3.4 废弃代码清理

- **FR-013**: 移除所有 `@deprecated` 标记的代码
- **FR-014**: 移除所有 backward compatibility 分支
- **FR-015**: 移除旧的 urgency/priority 兼容逻辑

### 3.5 质量护栏

- **FR-016**: 配置 Nx `enforce-module-boundaries` 规则
- **FR-017**: 配置 ESLint 命名规范规则
- **FR-018**: 配置 Import 限制（domain 不能依赖 infrastructure）

## 4. 非功能需求 (Non-Functional Requirements)

- **NFR-001**: 重构期间保持所有现有测试通过
- **NFR-002**: 重构完成后，apps 目录代码量减少 70%+
- **NFR-003**: 所有 packages 可独立编译和测试

## 5. 模块清单 (Module Inventory)

### API 模块 (14 个)
account, ai, authentication, dashboard, editor, goal, metrics, notification, reminder, repository, schedule, setting, system, task

### Web 模块 (13 个)
account, ai, app, authentication, dashboard, editor, goal, notification, reminder, repository, schedule, setting, task

## 6. 后续行动 (Action Items)

1. 生成详细的 Epics 和 Stories
2. 按优先级执行重构
3. 建立质量护栏
