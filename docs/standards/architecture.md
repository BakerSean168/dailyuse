# 架构与分层规则

## 核心边界

- `apps/*` 是运行时容器，负责入口、装配、环境配置和平台适配。
- `packages/*` 承载可复用的业务模块、共享类型和基础能力。
- 共享契约集中在 `packages/contracts`，跨模块共享的值对象与通用领域类型集中在 `packages/domain-shared`。
- 文档、代码和治理脚本都以当前 Nx 工作区结构为准，不再维护脱离仓库现实的“理想结构图”。

## 依赖方向

箭头含义：`A -> B` 表示 "A 依赖 B"（B 是 A 的下游依赖）。

```text
app (runtime container) -> ui -> application -> domain -> shared
infrastructure -> domain (通过 port/adapter 接口)
```

## Nx Layer Tags

| Tag | 对应位置 | 职责 |
|-----|----------|------|
| `layer:shared` | `packages/contracts`、`packages/domain-shared`、`packages/utils` | 最底层共享依赖，不承载业务逻辑 |
| `layer:domain` | `packages/{feature}`（含 domain-server、application-server、infrastructure-server） | 领域包，内部再细分 domain/application/infra 子层 |
| `layer:infra` | 基础设施包（database、powersync 等） | 技术实现，不含业务规则 |
| `layer:ui` | `packages/app-vue`、`packages/app-react`、`packages/ui-vue-shadcn` | 展示层 |
| `layer:app` | `apps/*` | 运行时容器，只做装配和平台适配 |

## 规则

- Domain 业务逻辑（`domain-server`）不能依赖基础设施实现、UI 框架或运行时容器。
- Application 层负责编排 use case，不直接触碰 Express、Electron、Pinia、Vue 组件等框架对象。
- Infrastructure 层实现仓储、传输、数据库、文件系统等技术细节。
- UI / Presentation 层只负责展示、交互和状态编排，不承载核心业务规则。
- 新功能优先以领域包为单位落地，不再把业务逻辑长期堆积在 `apps/*`。

### 包内分层说明

当前采用"单包多层"模式：每个领域包（`packages/*`）内部同时包含 `domain-server`、`application-server`、`infrastructure-server`、`api` 等子目录，它们在 Nx 中共享同一个 `layer:domain` tag。

- `domain-server`：纯业务逻辑，不得依赖 infra 或 framework。
- `application-server`：编排 use case，依赖 domain-server。
- `infrastructure-server`：技术实现（Prisma、外部 API），依赖 domain-server 接口。
- `api/module.ts`：组合根（composition root），负责将 infra 实现注入 domain 接口。组合根位于领域包内是当前架构的务实选择，lint 规则允许 `layer:domain -> layer:infra` 以支持此模式。
- `controllers`：传输层适配器，依赖 application-server。

理想目标是通过 package-internal lint rule 约束 `domain-server` 不得导入 `infrastructure-server`，当前暂以文档约束为主。

## App 容器治理规则

`apps/*` 是运行时容器，不是业务逻辑的归属地。

**允许的 app-local 代码**：
- 入口点（`main.ts`、`index.tsx`、`app.py`）
- DI 装配（wiring domain modules to infrastructure）
- 环境配置、路由映射
- Runtime-specific integration（Electron IPC handlers、Express middleware、Expo routing）
- Platform-specific adapters（实现 packages 暴露的 port 接口）

**不允许的 app-local 代码**：
- Domain 实体、值对象、业务规则
- Application use case 实现
- 跨 app 重复的业务逻辑（应提取到 packages）

**治理方式**：
- 当前以文档约束为主，辅以 code review 把关
- 重复出现的 app-local 业务逻辑（如 api 和 desktop 共享的 schedule source executor）应提取到共享包
- 新增 app-local 模块需在 PR 中说明为何不能放在 packages 中

## 仓库约定

- 不要求向后兼容；优先做直接、结构化的根因修复。
- 如果规则已经能够由 `nx.json`、`eslint.config.ts`、`project.json`、测试或治理脚本直接表达，文档只保留原则与边界，不重复抄配置。
- 当架构决策影响多个模块或改变长期规则时，补 ADR，而不是在 README 或实现说明里长期堆积背景。
