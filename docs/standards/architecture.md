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
- `api/module.ts`：传输与生命周期适配器，不再承担组合根职责。feature 组装（选择 adapter → repository → application instance）由宿主 runtime composer 在 `register()` 之前完成（示范：`apps/api/src/runtime/compose-governance.ts`、`apps/desktop/src/main/runtime/compose-governance.ts`），`register()` 只做 transport 注册与模块生命周期（start/dispose）。Governance、Goal、Task 以及全部 batch 模块（account、data-portability、notification、reminder、repository、schedule、setting、AI）都已迁移到 host composer；API AI 最后一个 composition residual 已由 `2026-08-14-api-ai-composition-root-externalization.md` 关闭，`apps/api/src/runtime/compose-ai.ts` 在 API lane 拥有 Prisma 集合、服务 runtime 适配器与宿主能力 port。lint 规则允许 `layer:domain -> layer:infra` 以支持适配器选择。
- **App-local DB context users（允许的平台适配器）**：API lane 的 app-local host 适配器（如 `apps/api/src/modules/ai/*.adapter.ts`，直接持有 `db`/`repositoryStorageBaseDir`）是记录在案的允许平台适配器；同理 `@memoflow/ai` root 的 `AIService*Adapter` + `AIEvaluationReportFileAdapter` 作为宿主 composer 例外继续导出。它们不属于 transport seam，不参与 feature 组合。
- `controllers`：传输层适配器，依赖 application-server。

当前已经由 `tools/governance/package-internal-boundary-audit.mjs` 在 repo 级别执行第一层包内分层治理，并接入 `pnpm nx run memoflow:governance-check`。

- 当前审计重点覆盖：
  - `domain-server` 不得导入 `infrastructure-server`、`application-client`、`infrastructure-client`、`api`、`controllers`
  - `application-server` 不得导入 `infrastructure-server`、`application-client`、`infrastructure-client`、`api`、`controllers`
  - `controllers` 不得导入 `infrastructure-server`、`infrastructure-client`、`api`
- 当前仍存在少量已登记的 known violations；这些属于待清零的技术债，不表示规则尚未存在。
- 后续若 repo-level audit 覆盖不够细，再评估是否进一步抽成 ESLint rule。

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
- 包内分层已优先由治理脚本执行；app-local 业务逻辑归属仍以文档约束与 code review 把关为主
- 重复出现的 app-local 业务逻辑（如 api 和 desktop 共享的 schedule source executor）应提取到共享包
- 新增 app-local 模块需在 PR 中说明为何不能放在 packages 中

## 仓库约定

- 不要求向后兼容；优先做直接、结构化的根因修复。
- 如果规则已经能够由 `nx.json`、`eslint.config.ts`、`project.json`、测试或治理脚本直接表达，文档只保留原则与边界，不重复抄配置。
- 当架构决策影响多个模块或改变长期规则时，补 ADR，而不是在 README 或实现说明里长期堆积背景。

## 机器可执行治理与审计（新增）

为保证架构规则的可验证性与可执行性，本仓库已将一部分关键规则迁移为机器可执行的治理脚本与 lint 规则，并继续收紧剩余豁口：

- 运行 pnpm nx run memoflow:governance-check 可以执行完整治理审计链（JSDoc 审计、包内分层约束、根导出审计、raw event bus 回退审计等）。
- 常用治理脚本位于 tools/governance：
  - governance-module-docs-audit.mjs — 检查 JSDoc / 注释质量（English-first、@param/@returns、@internal 等）。
  - package-internal-boundary-audit.mjs — 校验包内分层边界（禁止 domain-server 直接导入 infrastructure-server 等）。
  - package-export-audit.mjs — 检查根 barrel 是否泄露具体 infra 实现。
  - raw-event-bus-audit.mjs — 禁止非 infra 生产代码直接回退到 `eventBus.on/off/send(...)`。
  - trim-root-exports.mjs — 自动化候选修复：移除根导出中的 infra re-export（会生成可审查的修改并提交小粒度 PR）。
  - fix-governance-jsdoc.mjs — best-effort JSDoc 补全脚本（需要人工复核）。

治理变更流程（建议）：
1. 在 feature 分支运行 pnpm nx run memoflow:governance-check 并修复本地问题。
2. 若需要跨包修改（如收窄根导出），运行 tools/governance/trim-root-exports.mjs 的 dry-run，审阅变更后提交小粒度 PR。
3. 为临时豁免登记 owner 与 targetDate（tools/governance/target-baseline-manifest.json），并在到期前逐步消化豁免。

原则：文档记录原则与理由，机器化脚本负责可检验的实现性规则。
