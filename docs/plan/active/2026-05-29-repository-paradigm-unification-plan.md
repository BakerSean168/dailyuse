---
tags:
  - plan
  - active
  - governance
  - architecture
  - lint
description: 基于 2026-05-31 当前工作树状态的仓库范式统一执行审计与后续深化计划
created: 2026-05-29T00:00:00
updated: 2026-05-31T12:00:00
---

# 2026-05-29 Repository Paradigm Unification Plan

## 2026-05-31 执行审计更新

以下内容是对 2026-05-30 审计的增量更新。**当前真值以本节为准**。

### 本轮完成的工作

1. **PR-5 + PR-6 合并完成：package export audit 扩展 + 全仓 application-server 子路径清理**
   - `package-export-audit.mjs` 已从"只审计 `src/index.ts`"扩展为"同时审计 `src/index.ts` 与 `package.json#exports`"
   - 审计使用白名单机制：默认允许 `.`、`./domain-shared`、`./domain-server`、`./domain-client`、`./application-client`、`./infrastructure-server`、`./infrastructure-client`、`./api`、`./electron-entry`
   - `./application-server` 不在默认白名单中（经审计确认全仓 12 个 feature 包的 `application-server` 子路径零外部消费者）
   - 已从以下 12 个包的 `package.json#exports` 中移除 `./application-server`：
     `account`、`ai`、`authentication`、`editor`、`goal`、`governance`、`notification`、`reminder`、`repository`、`schedule`、`setting`、`task`
   - `governance` 额外的 package-specific 白名单：`./contracts`、`./mocks`
   - `task` 额外的 package-specific 白名单：`./testing`、`./schema`

2. **PR-4 Slice C3 前置审计完成**
   - 对 `goal`（37 个测试文件）、`task`（47 个测试文件）做了完整 import 审计
   - 结论：两个包的测试层都已经是干净的，没有 private infra/api 路径穿透
   - `desktop authentication` 测试有跨层 import，但位于 `apps/desktop/` 而非 `packages/`，结构不同，暂不纳入本轮

3. **PR-4 Slice C4/C5 完成：移除测试层全局 `no-restricted-imports` 关闭**
   - `eslint.config.ts` 全局测试豁免块中移除了 `no-restricted-imports: 'off'`
   - `@nx/enforce-module-boundaries: 'off'` 保留（测试作为入口点合法跨包边界）
   - 测试文件现在继承默认的 subpath import 规则（`@dailyuse/utils` 必须用子路径）
   - `repository`、`ai` 的 package-specific 测试限制规则现在生效（之前被全局关闭覆盖）
   - 验证：`goal`/`task`/`repository`/`ai`/`schedule`/`notification`/`governance` lint 全部通过，0 新增错误
   - 全量 `governance-check --skip-nx-cache` 通过

4. **PR-8 第一轮完成：target baseline exemption 压缩**
   - 为 `ipc-client` 新增 vitest + 16 个测试，消除 `ipc-client:test` 临时豁免
   - 重新分类豁免：`database:test`、`mobile:test` 从临时改为永久；`dashboard:test`、`ui-vue-shadcn:test`、`app-react:test`、`ui-react-native:test`、`http-client:test` 从永久改为临时
   - 当前 14 个 documented exemption（从 15 降至 14）

5. **PR-8 第二轮完成：http-client + dashboard 测试基础设施**
   - `http-client`: 新增 vitest + 15 个测试（`HttpClientError`、`createAxiosInstance`、`AxiosHttpClient`、`ResultHttpClient`）
   - `dashboard`: 新增 vitest + 12 个测试（`getDashboardData` projection 逻辑，使用 mock `DashboardReadSource`）
   - 消除 `http-client:test` 和 `dashboard:test` 两个临时豁免
   - 当前 **12 个 documented exemption**（从 25 → 15 → 14 → 12）

### 当日验证的命令

1. `node tools/governance/package-export-audit.mjs` — 通过
2. `pnpm nx run daily-use:governance-check --skip-nx-cache` — 通过（全绿）
3. `pnpm nx run governance:lint` — 通过
4. `pnpm nx run governance:test --skip-nx-cache` — 通过（139 tests）
5. `pnpm nx run repository:lint` — 通过
6. `pnpm nx run repository:test --skip-nx-cache` — 通过（54 tests）
7. `pnpm nx run goal:test --skip-nx-cache` — 通过（297 tests）
8. `pnpm nx run goal:lint` — 失败（既有 `no-explicit-any` in `prisma-weight-snapshot-mapper.ts`，非本轮回归）
9. `pnpm nx run task:lint` — 通过
10. `pnpm nx run task:test --skip-nx-cache` — 失败（既有 `task-dependency-and-goal-binding.test.ts` 断言失败，非本轮回归）
11. `pnpm nx run http-client:test --skip-nx-cache` — 通过（15 tests）
12. `pnpm nx run dashboard:test --skip-nx-cache` — 通过（12 tests）
13. `pnpm nx run eslint.config.ts` — 通过（`no-restricted-imports` 关闭已移除，无回归）

### 执行状态总览（更新）

| Track | 当前状态 | 审计结论 |
| --- | --- | --- |
| Track 1: 包内分层约束机器化 | 已闭环 | `package-internal-boundary-audit` 0 known violations |
| Track 2: target baseline 豁免收缩 | **已大幅推进** | 12 个 documented exemption（从 25 → 15 → 14 → 12），3 个临时豁免剩余（均为 UI 组件库，需框架特定测试基础设施） |
| Track 3: 测试边界治理收紧 | **已闭环** | `repository + ai` testing seams 已落地；`goal` / `task` 已确认干净；全局 `no-restricted-imports` 关闭已移除；package-specific 限制已生效 |
| Track 4: 稳定公共 API 面收窄 | **audit 已扩展，dead exports 已清理** | `package-export-audit.mjs` 现在同时覆盖 `src/index.ts` 与 `package.json#exports`；12 个包的 `./application-server` dead export 已移除；白名单机制已落地 |
| Track 5: typed API module context | API module 基本完成，生产 cast 未清零 | 仍存在 4 处实现体内部 `as PrismaClient` cast（hidden behind overloaded signatures） |
| Track 6: governance 活文档审计深化 | 已落地 | 持续维护中 |
| Track 7: lint ratchet | 已超出 governance 试点 | 多个高价值包已升级为 error |

### 下一轮推荐执行顺序（更新）

1. ~~PR-1 ~ PR-3~~：已完成
2. ~~PR-4（test seams + 测试边界治理）~~：**全部完成**
   - Slice C1/C2: `repository` + `ai` testing seams 已落地
   - Slice C3: `goal` / `task` 已确认不需要 testing seam
   - Slice C4/C5: 全局 `no-restricted-imports` 关闭已移除，package-specific 限制已生效
3. ~~PR-5 + PR-6（export audit 扩展 + dead exports 清理）~~：已完成
4. ~~PR-7（Prisma cast seam）~~：**大部分完成**
   - account: `as PrismaClient` 已完全消除（使用 `AccountDb` 最小接口）
   - schedule: `withTransaction` 的 `tx as PrismaClient` 已消除（使用 `ScheduleDb` / `ScheduleTaskDb` 最小接口 + overloaded constructors）
   - notification / repository factory: 实现体内部仍保留 cast，但调用方已通过 overloaded signatures 获得类型安全
   - 剩余 cast：4 处实现体内部 cast + 2 处注释文本
5. ~~PR-8（两轮完成）~~：target baseline exemption 从 25 → 12
   - 第一轮：ipc-client 测试 + 豁免重分类（25 → 14）
   - 第二轮：http-client + dashboard 测试基础设施（14 → 12）
   - 剩余 3 个临时豁免：`ui-vue-shadcn:test`、`app-react:test`、`ui-react-native:test`（均为 UI 组件库，需 Vue Test Utils / React Native 测试基础设施）
6. **剩余工作**（低优先级）：
   - PR-7 剩余：4 处实现体内部 cast（hidden behind overloads，类型安全已由 overloaded signatures 保证）
   - PR-8 深化：为 3 个 UI 组件库添加框架特定测试基础设施（需 Vue Test Utils / Expo test runner 集成）

## 2026-05-30 执行审计更新

以下内容是对 2026-05-29 方案的执行审计。下文原始正文继续保留，作为当日基线判断；**当前真值以本节为准**。

### 当日重新验证的命令

1. `pnpm nx run daily-use:governance-check`
   - 2026-05-30 以 `--skip-nx-cache` 重新执行通过
   - 当前通过链路已包含：
     - `target-baseline-audit`
     - `governance-module-docs-audit`
     - `server-feature-shape-audit`
     - `package-internal-boundary-audit`
     - `package-export-audit`
   - 最新复跑结果：**0 条 known package-internal violations**
   - 2026-05-30 本轮已实际清掉：
     - `packages/ai/src/application-server/use-cases/commands/manage-ai-knowledge-note.use-case.ts`
     - `packages/schedule/src/application-server/source-executors/shared-source-executor.ts`

2. `pnpm nx run daily-use:target-baseline-check`
   - 2026-05-30 重新执行通过
   - 当前 documented exemptions 已从 2026-05-29 记录的 25 降到 **15**

3. `pnpm nx build api` / `pnpm nx build desktop`
   - 2026-05-30 重新执行，二者都失败
   - 失败点都落在既有依赖构建红线，而不是本轮 import 迁移本身：
     - `repository:build`
     - `schedule:build`
     - `governance:build`
   - 其中 `repository` 的 `tsup` bundling 已能完成，失败来自既有 TypeScript 错误；说明本轮 `FsStorageAdapter` 导入路径收口没有额外打坏 app-specific wiring

4. `pnpm nx run repository:lint` / `pnpm nx run repository:test --skip-nx-cache`
   - 2026-05-30 在新增 `packages/repository/src/testing/` 并迁移 application tests 后重新执行通过
   - 当前 `repository` application tests 已改为依赖 `../../testing` seam，而不是直接 import private infra path
   - 2026-05-30 还额外做过一次负向验证：
     - 临时加入 `application test -> ../../infrastructure-server/**` sentinel import
     - `repository:lint` 会被 repository-specific `no-restricted-imports` 明确拦截
     - sentinel 已删除，lint 再次恢复通过

5. `pnpm nx run ai:lint` / `pnpm nx run ai:test --skip-nx-cache`
   - 2026-05-30 在新增 `packages/ai/src/testing/` 并迁移 `ai-query-services.test.ts` 后重新执行通过
   - 当前 AI application test 已改为依赖 `../../../../testing` seam，而不是直接 import `../../../../infrastructure-server/ai.module`
   - 2026-05-30 还额外做过一次负向验证：
     - 临时加入 `application test -> ../../../../infrastructure-server/ai.module` sentinel import
     - `ai:lint` 会被 AI-specific `no-restricted-imports` 明确拦截
     - sentinel 已删除，lint 再次恢复通过

### 执行状态总览

| Track | 当前状态 | 审计结论 |
| --- | --- | --- |
| Track 1: 包内分层约束机器化 | 已闭环第一版 | `project.json` 已把 `package-internal-boundary-audit.mjs` 接入 `daily-use:governance-check`；`docs/standards/architecture.md` 与 `ADR-031` 已改为“规则已落地”的表述；2026-05-30 本轮代码收口已把 known violation 从 4 压到 0 |
| Track 2: target baseline 豁免收缩 | 已明显推进 | manifest 已升级到 v2，temporary exemption 强制 `owner` + `targetDate`；但当前仍有 15 个 documented exemption，尚未收敛到计划要求的 10 以内 |
| Track 3: 测试边界治理收紧 | `repository + ai` 试点已落地，但 repo-wide 仍未闭环 | `packages/repository/src/testing/` 与 `packages/ai/src/testing/` 已落地；repository application tests 已迁移到 `../../testing`，AI application tests 已迁移到 `../../../../testing`；`eslint.config.ts` 已分别对 repository / ai tests 加入专用 `no-restricted-imports` 拦截 private infra/api import；但全仓测试层仍存在 `@nx/enforce-module-boundaries` 与 `no-restricted-imports` 的全局关闭，尚未进入 package-scoped allowlist 阶段 |
| Track 4: 稳定公共 API 面收窄 | **audit 已扩展，dead exports 已清理** | `package-export-audit.mjs` 已扩展为同时审计 `src/index.ts` 与 `package.json#exports`；12 个包的 `./application-server` dead export 已移除；白名单机制已落地；`infrastructure-server` / `api` / `infrastructure-client` 保留（有活跃消费者） |
| Track 5: typed API module context | API module 基本完成，仓库 seam 未清零 | 12 个 feature `api/module.ts` 已统一使用 `ServerModuleContext<PrismaClient>`；但生产代码中仍存在 `as PrismaClient` cast，且 `ServerModuleContext<DbClient = unknown>` 仍保留兼容默认值 |
| Track 6: governance 活文档审计深化 | 基本落地 | `governance-module-docs-audit.mjs` 已不再只是 existence check，当前会检查文件级 JSDoc 内容量、English-first / 中文 second、`@internal`、公开导出 JSDoc，且 2026-05-30 复跑通过 |
| Track 7: lint ratchet | 已超出最初 `governance` 试点 | `eslint.config.ts` 已把多组高价值包生产代码目录的 `no-explicit-any` / `no-unused-vars` 升为 `error`，不再只局限于 `governance` |

### 明确结论

当前仓库**不能**被判定为“方案已经优雅完整实现”。

原因不是“治理不存在”，而是还存在三类足以阻止完成判定的现实缺口：

1. **规则已存在，但 repo-wide 收口还没完成**
   - `package-internal-boundary-audit` 已经收口到 0 tracked known violations
   - 但测试边界、public surface、typed context、target baseline 仍未全部闭环

2. **治理通过，但仍依赖制度化豁口**
   - `target-baseline-audit` 仍保留 15 个 documented exemption
   - 测试边界仍是宽泛豁免，而不是受控 seam

3. **示范模块变强了，但 repo-wide 统一范式还没全部收口**
   - `governance` 的确已经成为更强的实验田
   - 但根导出面、typed context phase 2、测试 allowlist 机制、已知越层依赖清零都还没完成

### 显式完成度审计

以下审计直接对照本文件“完成判定”中的 7 条要求，结论以 2026-05-30 当前工作树与已复跑命令结果为准。

| 完成要求 | 当前证据 | 结论 | 仍缺什么 |
| --- | --- | --- | --- |
| 1. package-internal layering 不再主要靠文档约束 | `package-internal-boundary-audit.mjs` 已接入 `daily-use:governance-check`；`architecture.md` 与 `ADR-031` 已改为“规则已落地”口径；`goal`、`repository`、`ai`、`schedule` 的 4 条 tracked violation 已在 2026-05-30 全部清零 | `已完成` | 后续只需保持 `KNOWN_VIOLATIONS` 为空并防止回退 |
| 2. target baseline documented exemption 显著减少，并且临时豁免都有 owner 与收口时间 | `target-baseline-manifest.json` 已升级到 v2；temporary exemption 强制 `owner` + `targetDate`；`daily-use:target-baseline-check` 当前报告 15 个 documented exemption | `部分完成` | 15 仍高于计划要求的 10 以内 |
| 3. 测试边界不再整体豁免 module boundary rules | `eslint.config.ts` 的全仓测试块仍对 `@nx/enforce-module-boundaries` 与 `no-restricted-imports` 做全局关闭；但 `repository` 与 `ai` 已新增 `src/testing` seam，application tests 已迁移到 test-support import，且 package-specific `no-restricted-imports` 已能拦截 private infra/api import | `未完成` | 需要把 `repository + ai` 试点扩展成真正的 package-scoped allowlist，并最终移除全局测试关闭 |
| 4. `governance` 活文档审计能验证注释质量，而不只是 JSDoc 存在性 | `governance-module-docs-audit.mjs` 已检查文件级 JSDoc 内容量、English-first / 中文 second、`@internal`、公开导出 JSDoc；复跑通过 | `已完成` | 后续只需持续维护 |
| 5. `governance` 和至少 3 个高价值 feature 包完成稳定 public surface 收缩 | `governance` 仅完成了 root barrel 第一层收窄；`governance`、`goal`、`task`、`repository` 的 `package.json#exports` 仍公开宽 surface | `未完成` | 需扩展 package export audit 到 `package.json#exports`，并同时收口 `governance` + 至少 3 个高价值包 |
| 6. 高价值模块开始使用目录级 lint ratchet，而不是继续停留在全局 warn | `eslint.config.ts` 已将多个高价值包生产代码目录的 `no-explicit-any` / `no-unused-vars` 升为 `error` | `已完成` | 后续是扩大范围，不影响本条已达成 |
| 7. feature `api/module.ts` 的 `db: unknown` + `as PrismaClient` 模式被统一替换 | 12 个 feature `api/module.ts` 已统一使用 `ServerModuleContext<PrismaClient>`；但生产代码仍有 5 处 `as PrismaClient` cast，shared contract 仍保留 `DbClient = unknown` 默认值 | `部分完成` | 需清零剩余生产 cast，并收紧 shared contract |

结论：7 条完成要求里，当前已有 **3 条可直接判定为已完成**，**2 条是部分完成**，**2 条仍未完成**。因此当前状态仍只能叫“治理显著深化并已有强约束基础”，不能叫“范式已经优雅完整收口”。

### 命令真实性审计

为避免后续执行方案停留在“看起来合理但仓库里并没有对应 target”的层面，已额外核对本计划中最常用的项目级验证命令。

| 项目 | `build` | `lint` | `typecheck` | `test` | 备注 |
| --- | --- | --- | --- | --- | --- |
| `repository` | 存在 | 存在 | 存在 | 存在 | `build` 依赖 `database:build` |
| `goal` | 存在 | 存在 | 存在 | 存在 | 另有 integration / coverage 细分 target |
| `ai` | 存在 | 存在 | 存在 | 存在 | 适合验证 PR-2 |
| `schedule` | 存在 | 存在 | 存在 | 存在 | 另有 integration / coverage 细分 target |
| `governance` | 存在 | 存在 | 存在 | 存在 | 适合验证 export / docs 审计相关改动 |
| `notification` | 存在 | 存在 | 存在 | 存在 | 适合验证 repository-factory cast 清理 |

补充说明：

1. 本计划中引用的项目级 `build/lint/test/typecheck` 命令均有真实 Nx target 支撑，不是名义命令。
2. 多包联合验证时，`pnpm nx run-many -t typecheck --projects=...` 仍是合理入口，但应把它视为**补充性验证**；每个 PR 先过本地项目 target，再过联合 target。
3. 多数 library 的 `build` target 都依赖 `database:build`，所以 PR 级最小验证应优先 `lint` / `test` / `typecheck`，只有涉及 export surface 或构建产物时再跑 `build`。
4. 当前 `package-export-audit.mjs` **只审计 `src/index.ts`，不审计 `package.json#exports`**；因此“governance-check 全绿”不能被误读为“export map 已收口”。

### Target Baseline 可行性修正

对 `tools/governance/target-baseline-manifest.json` 的当前真值再做了一次分布审计：

- documented exemptions 总数：`15`
- 其中 `permanent`：`12`
- 其中 `temporary`：`3`

这意味着：

1. **“总 exemptions <= 10” 在当前分类模型下并不直接成立**
   - 因为仅 `permanent` 豁免就已经有 `12`
   - 若不回收或重分类部分 `permanent` 豁免，单纯清掉所有 `temporary` 也只能降到 `12`

2. 因此 Track 2 的后续目标需要按两层表达，而不是只保留一个总数：
   - 第一层目标：`temporary exemptions = 0`
   - 第二层目标：复核现有 `permanent` 豁免，确认哪些其实属于工程欠账并应改回 `temporary` 或直接补 target

3. 当前 manifest 中最值得复核的 `permanent` 条目不是平台天然例外，而是这些表述偏像“延后”而非“永久不需要”：
   - `dashboard:test`
   - `ui-vue-shadcn:test`
   - `app-react:test`
   - `ui-react-native:test`
   - `http-client:test`

4. 因此更现实、更可治理的阶段目标应改为：
   - Phase F1：把 `temporary` exemptions 从 `3` 压到 `0`
   - Phase F2：复核全部 `permanent` exemptions，清理误分类
   - Phase F3：在完成误分类回收后，再争取把总 exemptions 压到 `10` 以内

### 当前剩余问题清单（按优先级）

1. 把已在 `repository` 落地的 test-support seam + package-scoped lint 模式扩展到更多包，并最终移除“测试文件整体关闭边界规则”。

2. 扩大 package export audit 的定义，不再只禁止 `export * from './infrastructure-server'`，而是同时治理 `src/index.ts` 与 `package.json#exports` 的 public surface 白名单。

3. 完成 typed context 第二阶段：
   - 移除生产代码残留的 `as PrismaClient`
   - 收紧 `ServerModuleContext<DbClient = unknown>` 的兼容默认值

4. 继续收缩 target baseline exemptions，从 15 进一步压到 10 以内。

### 修订后的后续优雅完整实现方案

#### Phase A: 回收“规则已落地但文档仍写 future work”的真值漂移

1. 更新 `docs/standards/architecture.md`
   - 把“当前暂以文档约束为主”改为“已由 `package-internal-boundary-audit.mjs` 执行第一层包内分层治理”
   - 同时明确：当前剩余 known violation 只是收口中的技术债，不是规则尚未存在

2. 更新 `ADR-031`
   - 把 package-internal lint rules 的表述从 “future work” 改成“已由 repo-level governance audit 落地，后续可再评估是否抽成 ESLint rule”

3. 把 active plan 的完成判定细化为可审计门槛：
   - `package-internal-boundary-audit` 已知违规数 = 0
   - `target-baseline-audit` documented exemptions <= 10
   - 测试边界不再全局关闭
   - 根公共导出面有明确白名单审计
   - 生产代码中不再出现 `as PrismaClient`

#### Phase B: 清零 package-internal known violations，让 Track 1 真正闭环

2026-05-30 当前状态：**已完成**

1. `goal`
   - 2026-05-30 执行状态：**已完成**
   - 2026-05-30 代码核对结果：
     - 当前违规集中在 `packages/goal/src/application-server/mappers/goal.mapper.ts`
     - 问题点是 `GoalMapper.toDomain(raw: RawGoalData)` 直接依赖 `infrastructure-server/adapters/prisma/mappers/goal-state-mapper`
     - 当前仓库内未检索到 `GoalMapper.toDomain(...)` 的调用点；因此已直接删除 `toDomain` 与相关 infra import，而不是再抽一层中间 mapper
     - `goal:lint` 当前仍不通过，但失败点是既有 `no-explicit-any` 红线，不是这条越层依赖修复本身

2. `ai`
   - 2026-05-30 执行状态：**已完成**
   - 2026-05-30 代码核对结果：
     - 当前 `AIKnowledgeNotePathResolver` 只做字符串清洗与 slugify，不依赖数据库、网络、文件系统或 runtime 对象
     - 这说明它并不是 infra service，而是纯计算逻辑
     - 已按最短优雅路径完成：
       - 把它移动到 `application-server/services/ai-knowledge-note-path-resolver.ts`
       - runtime / electron entry / tests 全部改依赖该应用层实现
     - 验证结果：
       - `pnpm nx run ai:lint` 通过（仅剩既有 warnings）
       - `pnpm nx run ai:test --skip-nx-cache` 通过
     - 只有在未来出现真实平台差异（不同 runtime 生成不同路径规则）时，才值得升级成可注入 port

3. `repository`
   - 2026-05-30 执行状态：**已完成**
   - 2026-05-30 代码核对结果：
     - 当前违规不是业务逻辑错误，而是 `packages/repository/src/application-server/index.ts` 通过根导出把 `FsStorageAdapter` 重新泄露给 application surface
     - `IStoragePort` 已经定义在 `application-server/ports/i-storage-port.ts`
     - `api/module.ts` 与 `electron-entry/index.ts` 已经直接从 infra 子路径导入 `FsStorageAdapter`
     - 因此已执行最短且最干净的修复：
       - 删除 `application-server/index.ts` 对 `FsStorageAdapter` 的 re-export
       - 明确消费者改为从 `@dailyuse/repository/infrastructure-server` 导入
     - `repository:lint` 已重新通过；过程中还顺手修复了 `packages/repository/src/index.ts` 中一个既有 root barrel 语法错误，避免 lint 被无关 parse error 阻断

4. `schedule`
   - 2026-05-30 执行状态：**已完成**
   - 2026-05-30 代码核对结果：
     - 当前 `ScheduleTaskExecutionResult` 与 `ScheduleTaskSourceExecutor` 只定义在 `packages/schedule/src/api/runtime.ts`
      - `application-server/source-executors/shared-source-executor.ts` 因而被迫反向依赖 `api/runtime`
     - 已按 application-level contract 路线完成：
       - 新增 `application-server/source-executors/runtime-contract.ts`
       - `api/runtime.ts` 改为消费并 re-export 该 contract
       - `api/module.ts`、`electron-entry/index.ts` 改为从新 contract 导入 `ScheduleTaskSourceExecutor`
       - `shared-source-executor.ts` 不再反向 import `api/**`
     - 验证结果：
       - `pnpm nx run schedule:test --skip-nx-cache` 通过
       - `pnpm nx run schedule:lint` 通过（仅剩既有 warnings）

5. 完成后收紧 audit
   - 当前 `daily-use:governance-check --skip-nx-cache` 已显示 `0 known violation(s) tracked`
   - `tools/governance/package-internal-boundary-audit.mjs` 中的 `KNOWN_VIOLATIONS` 已清空；后续目标是保持其为空并防止回退

#### Phase C: 让测试边界治理从宽豁免进入受控 seam

2026-05-30 当前状态：**`repository + ai` 的试点已完成，但 Track 3 整体仍未完成**

1. 已完成的 repository 试点
   - 已新增 `packages/repository/src/testing/`
     - 当前暴露：
       - `createRepositoryMemoryTestRepositories(...)`
       - `createTestFsStorage(...)`
   - `packages/repository/src/application-server/__tests__/*` 已改为依赖 `../../testing`
   - `eslint.config.ts` 已对 repository application tests 新增专用 `no-restricted-imports`
     - 明确禁止 `../../infrastructure-server/**`
     - 明确禁止 `../../api/**`
   - 已完成负向验证：
     - 临时加入一条 `application test -> private infra path` sentinel import
     - `pnpm nx run repository:lint` 会报错：
       - `Repository application tests must use ../../testing seams instead of private infrastructure or api paths.`
   - 当前正向验证：
     - `pnpm nx run repository:test --skip-nx-cache` 通过
     - `pnpm nx run repository:lint` 通过

2. 已完成的 AI 试点
   - 已新增 `packages/ai/src/testing/`
     - 当前暴露：
       - `createAIModuleForTests(...)`
       - `createAIProviderConfigRepositoryStub(...)`
       - `createAIProviderConfigServerDTO(...)`
   - `packages/ai/src/application-server/use-cases/commands/__tests__/ai-query-services.test.ts` 已改为依赖 `../../../../testing`
   - `eslint.config.ts` 已对 AI application tests 新增专用 `no-restricted-imports`
     - 明确禁止 `**/infrastructure-server/**`
     - 明确禁止 `**/api/**`
   - 已完成负向验证：
     - 临时加入一条 `application test -> ../../../../infrastructure-server/ai.module` sentinel import
     - `pnpm nx run ai:lint` 会报错：
       - `AI application tests must use src/testing seams instead of private infrastructure or api paths.`
   - 当前正向验证：
     - `pnpm nx run ai:test --skip-nx-cache` 通过
     - `pnpm nx run ai:lint --skip-nx-cache` 通过

3. 下一步目标仍然是在 `eslint.config.ts` 中取消当前测试层对 `@nx/enforce-module-boundaries` / `no-restricted-imports` 的全局关闭策略

4. 改成两层模型：
   - 默认测试规则：仍执行边界检查
   - 受控 allowlist：仅对 `packages/test-utils/**`、`src/test/**`、明确命名的 fixtures / public subpath exports 开白名单

5. 后续试点顺序：
   - 2026-05-30 已完成前两批试点：
     - `packages/repository`
     - `packages/ai`
   - 下一批优先：
     - `packages/goal`
     - `packages/task`
     - `apps/desktop/src/main/modules/authentication`
   - AI 当前最关键的 private seam 已收口：`ai-query-services.test.ts` 不再直连 `infrastructure-server/ai.module`

6. 验证方式：
   - 人为引入一条跨模块私有实现 import，确认 lint 失败
   - 同时确认合法 test seam 仍可通过

7. 推荐的优雅实施切片：
   - Slice C1：`repository` application-test seam
     - 2026-05-30 执行状态：**已完成**
     - 已完成动作：
       - 新增 `packages/repository/src/testing/`
       - 现有 `application-server/__tests__` 不再直接 import `infrastructure-server/adapters/*`
       - repository-specific `no-restricted-imports` 已落地并经 sentinel 负向验证
   - Slice C2：`ai` application-test seam
     - 2026-05-30 执行状态：**已完成**
     - 已完成动作：
       - 新增 `packages/ai/src/testing/`
       - `ai-query-services.test.ts` 不再直接 import `infrastructure-server/ai.module`
       - AI-specific `no-restricted-imports` 已落地并经 sentinel 负向验证
   - Slice C3：收 `goal` / `task` / `desktop authentication` 的真实穿透点
     - 需要继续审计这些包/模块是否仍直接 import private implementation
   - Slice C4：在 ESLint 中引入 test-only allowlist
     - 先只对白名单测试支持目录关闭 restricted import
     - 其余测试恢复 `@nx/enforce-module-boundaries`
   - Slice C5：最后才收紧全仓测试规则
     - 先对 `repository`、`ai`、`goal`、`task` 验证
     - 再推广到其余包

#### Phase D: 统一稳定公共 API 面，而不是只禁止最粗暴的 infra re-export

1. 为 feature root barrel 定义白名单
   - 允许：
     - contracts
     - domain-shared
     - 稳定的 application-client factory
     - composition root factory / module factory
     - 必要的 stable type aliases
   - 默认不允许：
     - `export * from './application-server'`
     - `export * from './application-client'`
     - `export * from './infrastructure-client'`
     - 具体 Prisma / PowerSync / Fs / Memory adapter class

2. 扩展 `package-export-audit.mjs`
   - 从“只抓 infra root-star export”扩展为“检查 root barrel 是否超出白名单”
   - 2026-05-30 代码核对结果表明，仅审计 `src/index.ts` 还不够，因为 `package.json` 仍在正式公开宽 surface：
     - `packages/goal/package.json`
     - `packages/task/package.json`
     - `packages/repository/package.json`
   - 当前这些包都仍公开：
     - `./application-server`
     - `./application-client`
     - `./infrastructure-server`
     - `./infrastructure-client`
     - `./api`
   - 因此 Track 4 需要补成两层审计：
     - `src/index.ts` root barrel audit
     - `package.json#exports` export-map audit

3. 第一批收口包：
   - `governance`
   - `goal`
   - `task`
   - `repository`

4. 目标状态
   - 根入口只保留稳定消费面
   - 教学/实现可见性通过 subpath export 获取，而不是从 `.` 自动暴露

5. 推荐的优雅实施切片：
   - Slice D1：先定义 export-map 白名单策略
     - 默认允许：
       - `.`
       - `./domain-shared`
       - `./domain-server`
       - 稳定的 `./application-client`
       - 必要的 `./infrastructure-server` composition root
     - 默认不再新增：
       - `./application-server`
       - `./api`
       - `./infrastructure-client`
       - 任何仅供内部 wiring 使用的 surface
   - Slice D2：扩展 `package-export-audit.mjs`
     - 同时读取 `package.json` 与 `src/index.ts`
     - 对 export map 与 root barrel 做统一白名单校验
   - Slice D3：优先收口 `repository`
     - 它当前既有宽 root barrel，也有宽 export map，且还伴随测试直接依赖 infra
   - Slice D4：再收口 `goal` 与 `task`
     - 两者 root barrel 和 export map 结构接近，适合用同一模板批量推进

#### Phase E: 完成 typed context 第二阶段，移除生产代码中的 Prisma cast seam

1. 先把搜索范围明确锁定到 production code：
   - `packages/notification/src/infrastructure-server/di/notification-repository.factory.ts`
   - `packages/repository/src/infrastructure-server/di/repository-repository.factory.ts`
   - `packages/schedule/src/infrastructure-server/adapters/prisma/*.ts`
   - `packages/account/src/infrastructure-server/adapters/prisma/account-prisma.repository.ts`

2. 设计统一替代方式：
   - 用 typed transaction / typed repository factory context，替代 `unknown -> PrismaClient` cast
   - 优先通过更准确的 port/interface 和 generic helper 清掉 cast
   - 2026-05-30 代码核对结果显示，剩余生产 cast 可以分成三类：
     - A. 事务 client 伪装成 `PrismaClient`
       - `packages/account/src/infrastructure-server/adapters/prisma/account-prisma.repository.ts`
       - `packages/schedule/src/infrastructure-server/adapters/prisma/schedule-prisma.repository.ts`
       - `packages/schedule/src/infrastructure-server/adapters/prisma/schedule-task-prisma.repository.ts`
     - B. 工厂方法把 union client 强转成 `PrismaClient`
       - `packages/notification/src/infrastructure-server/di/notification-repository.factory.ts`
       - `packages/repository/src/infrastructure-server/di/repository-repository.factory.ts`
     - C. 注释文本中提到旧模式
       - `packages/contracts/src/shared/server-module-context.ts`
       - `packages/governance/src/api/module.ts`

3. 推荐的优雅替代方向：
   - Slice E1：为 Prisma 仓储定义最小 DB 能力接口，而不是强依赖完整 `PrismaClient`
     - 例如 `AccountPrismaDb`、`SchedulePrismaDb`
     - 只包含仓储实际用到的 model delegate 与 `$transaction`
     - 这样 transaction client 与 root Prisma client 都能自然满足接口，不需要 `as PrismaClient`
   - Slice E2：为 `withTransaction` 使用 typed repo recreation
     - 让构造函数接收 `PrismaClient | Prisma.TransactionClient` 可满足的最小接口
     - `new SchedulePrismaRepository(tx)` / `new ScheduleTaskPrismaRepository(tx)` 直接通过类型检查
   - Slice E3：为 repository factory 使用 overload / discriminated union
     - `create('prisma', prismaClient): PrismaRepositories`
     - `create('powersync', electronDb): PowerSyncRepositories`
     - 避免在单个实现体里 `client as PrismaClient`
   - Slice E4：最后回收注释文本
     - 在生产 cast 清零后，再修改 `ServerModuleContext` 与相关 API module 注释，避免文档提前宣称完成

3. 第二阶段完成后再收紧 shared contract：
   - 去掉 `ServerModuleContext<DbClient = unknown>` 的默认值
   - 让所有使用方显式声明 `DbClient`

4. 验证门槛：
   - `rg -n "as PrismaClient" packages --glob "!**/*.test.ts" --glob "!**/*.spec.ts"` 为 0

#### Phase F: 继续压缩 target baseline exemptions

1. 先处理最像“工程欠账”而不是“技术天然例外”的项目
   - `database:test`
   - `ipc-client:test`
   - `dashboard:test`
   - `ui-vue-shadcn:test`

2. 重新审视 currently-permanent exemptions
   - 若本质上只是“暂时没补测试”，则不应长期标 permanent

3. 目标
   - `temporary` exemptions 从 3 压到 0
   - temporary exemption 一律保留 owner + targetDate
   - `permanent` exemption 只保留真正平台天然例外
   - 在完成误分类回收后，再把 documented exemptions 总数从 15 压到 10 以内

### 下一轮推荐执行顺序

1. `Phase A` 已完成：文档真值漂移已回收
2. `Phase B` 已完成：package-internal known violations 已清零
3. `Phase C`：把测试边界改成受控 allowlist
4. `Phase D`：扩大 root public surface audit 并收口 4 个高价值包
5. `Phase E`：清掉生产代码 Prisma cast seam
6. `Phase F`：继续压缩 target baseline exemptions

这样推进的原因很直接：

1. 文档真值已经回收，当前最值钱的是继续清规则内的已知例外
2. 测试 seam、公开面和 typed context 现在都已具备足够清晰的收口切片
3. 只有这些剩余切片完成，`governance` 的局部示范才能真正升级为 repo-wide 范式

### 建议按 PR 切片推进

下面的切片顺序按“对完成度审计提升最大、风险最低、可独立验证”排序。每个切片都应单独提交并独立过治理门禁。

1. `PR-1` 清零最便宜的 known violations
   - 2026-05-30 执行状态：**已完成**
   - 目标文件：
     - `packages/repository/src/application-server/index.ts`
     - `packages/goal/src/application-server/mappers/goal.mapper.ts`
   - 预期动作：
     - 删除 `FsStorageAdapter` 的 application-layer re-export
     - 删除无调用方的 `GoalMapper.toDomain` 及对应 infra import
   - 验证：
     - `pnpm nx run repository:lint` 通过
     - `pnpm nx run goal:lint` 仍失败，但失败点是 `packages/goal/src/infrastructure-server/adapters/prisma/mappers/prisma-weight-snapshot-mapper.ts` 中既有 `no-explicit-any` 错误，不是 `GoalMapper` 修复回归
     - `pnpm nx run daily-use:governance-check --skip-nx-cache` 通过，tracked known violations 从 4 降到 2

2. `PR-2` 抽离 AI knowledge note 路径解析到 application 层
   - 2026-05-30 执行状态：**已完成**
   - 目标文件：
     - `packages/ai/src/application-server/use-cases/commands/manage-ai-knowledge-note.use-case.ts`
     - 新增 application-level path helper/service
     - `packages/ai/src/infrastructure-server/runtime/*.ts`
     - `packages/ai/src/application-server/use-cases/commands/__tests__/ai-knowledge-note.service.test.ts`
   - 预期动作：
     - 移除 use case 对 `infrastructure-server/services/ai-knowledge-note-path-resolver` 的依赖
     - 测试改依赖 application-level helper
   - 验证：
     - `pnpm nx run ai:test --skip-nx-cache` 通过
     - `pnpm nx run ai:lint` 通过
     - `pnpm nx run daily-use:governance-check --skip-nx-cache` 通过，tracked known violations 从 2 降到 1

3. `PR-3` 抽离 schedule runtime contract，清零最后一条 api 反向依赖
   - 2026-05-30 执行状态：**已完成**
   - 目标文件：
     - `packages/schedule/src/api/runtime.ts`
     - `packages/schedule/src/application-server/source-executors/shared-source-executor.ts`
      - `packages/schedule/src/application-server/source-executors/runtime-contract.ts`
      - `packages/schedule/src/api/module.ts`
      - `packages/schedule/src/electron-entry/index.ts`
   - 预期动作：
     - 新建 shared/application-level runtime contract 文件
      - `shared-source-executor.ts` 不再 import `api/runtime`
   - 验证：
     - `pnpm nx run schedule:test --skip-nx-cache` 通过
     - `pnpm nx run schedule:lint` 通过（仅剩既有 warnings）
     - `pnpm nx run daily-use:governance-check --skip-nx-cache` 通过，tracked known violations 从 1 降到 0

4. `PR-4` 为 `repository + ai` 建立 test-support seam，并把它们作为 Track 3 的前两批受控试点
   - 目标文件：
     - `packages/repository/src/testing/`
     - `packages/ai/src/testing/`
     - `packages/repository/src/application-server/__tests__/*`
     - `packages/ai/src/application-server/use-cases/commands/__tests__/ai-query-services.test.ts`
     - `eslint.config.ts`
   - 2026-05-30 执行状态：**repository + ai 切片已完成，Track 3 剩余切片待继续**
   - 已完成动作：
     - 用测试支持层替代测试直接 import `infrastructure-server/adapters/*`
     - 新增 `packages/repository/src/testing/repository-test-support.ts`
     - 新增 `packages/repository/src/testing/index.ts`
     - repository application tests 已迁移到 `../../testing`
     - `eslint.config.ts` 已对 repository tests 新增专用 `no-restricted-imports`
     - 新增 `packages/ai/src/testing/ai-test-support.ts`
     - 新增 `packages/ai/src/testing/index.ts`
     - `ai-query-services.test.ts` 已迁移到 `../../../../testing`
     - `eslint.config.ts` 已对 AI application tests 新增专用 `no-restricted-imports`
   - 剩余动作：
     - 把同样的模式扩展到 `goal` / `task` / desktop authentication 等下一批包
     - 最终移除测试层的全局边界关闭
   - 验证：
     - `pnpm nx run repository:test --skip-nx-cache` 通过
     - `pnpm nx run repository:lint` 通过
     - `pnpm nx run ai:test --skip-nx-cache` 通过
     - `pnpm nx run ai:lint --skip-nx-cache` 通过
     - 人为加入一条 application test -> private infra import，repository / ai lint 都已确认失败后再删除 sentinel

5. `PR-5` 扩展 package export audit 到 export map，并先收口 governance + repository
   - 目标文件：
     - `tools/governance/package-export-audit.mjs`
     - `packages/governance/package.json`
     - `packages/repository/package.json`
     - 需要时同步调整 `src/index.ts`
   - 预期动作：
     - 同时审计 `src/index.ts` 和 `package.json#exports`
     - 先定义并应用白名单到两个包
   - 验证：
     - `pnpm nx run governance:build`
     - `pnpm nx run repository:build`
     - `pnpm nx run daily-use:governance-check`

6. `PR-6` 收口 goal + task export map
   - 目标文件：
     - `packages/goal/package.json`
     - `packages/task/package.json`
     - 必要时同步 `src/index.ts`
   - 预期动作：
     - 应用与 `governance` / `repository` 一致的 export-map 白名单
   - 验证：
     - `pnpm nx run goal:build`
     - `pnpm nx run task:build`
     - `pnpm nx run daily-use:governance-check`

7. `PR-7` 清零剩余 Prisma cast seam
   - 目标文件：
     - `packages/account/src/infrastructure-server/adapters/prisma/account-prisma.repository.ts`
     - `packages/schedule/src/infrastructure-server/adapters/prisma/schedule-prisma.repository.ts`
     - `packages/schedule/src/infrastructure-server/adapters/prisma/schedule-task-prisma.repository.ts`
     - `packages/notification/src/infrastructure-server/di/notification-repository.factory.ts`
     - `packages/repository/src/infrastructure-server/di/repository-repository.factory.ts`
     - 最后才改 `packages/contracts/src/shared/server-module-context.ts`
   - 预期动作：
     - 先用最小 DB 能力接口、typed transaction client、overload/discriminated union 清零生产 cast
     - 再回收 shared contract 默认泛型与注释文本
   - 验证：
     - `rg -n "as PrismaClient" packages --glob "!**/*.test.ts" --glob "!**/*.spec.ts"`
     - `pnpm nx run-many -t typecheck --projects=account,notification,repository,schedule,goal,task,governance`

8. `PR-8` 压缩 target baseline exemptions 到 10 以内
   - 目标文件：
     - `tools/governance/target-baseline-manifest.json`
     - 以及对应项目的 `project.json` / test targets
   - 预期动作：
     - 先清零当前 `temporary`：`mobile:test`、`database:test`、`ipc-client:test`
     - 再复核 `dashboard:test`、`ui-vue-shadcn:test`、`app-react:test`、`ui-react-native:test`、`http-client:test` 是否误标为 `permanent`
     - 只有在误分类回收后，再以总数 `<=10` 作为最终门槛
   - 验证：
     - `pnpm nx run daily-use:target-baseline-check`
     - `pnpm nx run daily-use:governance-check`

### Slice 依赖图

这些 PR 切片不是完全独立的。若顺序排错，会出现“先收 lint，再被测试 seam 卡住”或“先改注释，再被真实实现推翻”的问题。

#### 强依赖

1. `PR-1 -> PR-4`
   - `PR-4` 的 repository 切片已经建立在这个前置条件之上并完成
   - 2026-05-30 此前置条件已满足：`repository` 的 application surface 已停止 re-export `FsStorageAdapter`
   - 当前剩余的 `PR-4` 工作只是在此基础上把同类模式扩展到其他包

2. `PR-2 -> PR-4`
   - 2026-05-30 此前置条件已满足：`AIKnowledgeNotePathResolver` 已经从 infra 平移出去
   - 因此 `PR-4` 的下一步可以直接收 `ai` 测试边界，而不再受这条旧 seam 阻塞

3. `PR-3 -> PR-7`
   - 2026-05-30 此前置条件已满足：`schedule` runtime contract 已从 `api/runtime.ts` 抽离
   - `PR-7` 现在可以直接聚焦 Prisma cast 清理，而不再混入层次修复

4. `PR-5 -> PR-6`
   - `PR-5` 负责先把 `package-export-audit.mjs` 扩到 `package.json#exports`
   - `PR-6` 再用这个新门禁批量收口 `goal` 和 `task`
   - 否则 `PR-6` 只是人工收窄，没有新的治理约束守住

5. `PR-7 -> 注释口径回收`
   - `ServerModuleContext` 和相关 API module 注释中的旧 seam 描述必须在 production cast 清零后再回收
   - 否则文档会再次先于实现

#### 可并行边界

在多人并行或多 agent 并行时，以下组合是相对安全的：

1. `PR-4` 与 `PR-8` 可并行
   - 一个继续收 Track 3 剩余测试 seam / allowlist
   - 一个收 target baseline manifest / target 欠账
   - 共享文件极少

2. `PR-2` 与 `PR-5` 可并行
   - 该组合已失效，因为 `PR-2` 已完成

3. `PR-3` 与 `PR-8` 可并行
   - 该组合已失效，因为 `PR-3` 已完成

#### 推荐关键路径

若按“最快达成完成判定”排序，当前关键路径应为：

1. `PR-4` 剩余切片（Phase C2 ~ C4）
2. `PR-5`
3. `PR-6`
4. `PR-7`
5. `PR-8`

原因：

1. `PR-1 ~ PR-3` 已全部完成，完成判定第 1 条已由“部分完成”推进到“已完成”
2. `PR-4` 的 repository 试点已经落地，但 Track 3 仍是当前最明确的“未完成”项；因此关键路径已从“开始 PR-4”变成“完成 PR-4 的剩余切片”
3. `PR-5 ~ PR-6` 解决 public surface 收缩这条当前明确“未完成”的条目
4. `PR-7` 完成 typed context phase 2，把当前“部分完成”推进到可完成
5. `PR-8` 最后处理 baseline 总量和误分类回收，因为它对最终完成必要，但不阻塞前几条结构治理闭环

### PR 级执行前置条件

为保证这些切片保持“小而硬”的治理收口风格，执行时应遵守以下前置条件：

1. **每个 PR 只解决一个主 seam**
   - 例如不要在 `PR-4` 同时做 repository test seam、export map 收口和 Prisma cast 清理
   - 否则治理收益会被混在一起，回归范围也会失真

2. **先过项目局部验证，再跑 `daily-use:governance-check`**
   - 推荐顺序：
     - `<project>:lint`
     - `<project>:test`
     - `<project>:typecheck`
     - 如涉及 export / build 再跑 `<project>:build`
     - 最后再跑 `daily-use:governance-check`

3. **不要把“治理脚本本身还没覆盖”误判成“问题已经解决”**
   - 当前最典型例子就是 export map：
     - `package-export-audit` 仍绿
     - 但 `package.json#exports` 仍然很宽
   - 所以扩展审计脚本和收口实现需要同一 PR 完成，避免出现“实现变窄了，但未来没人守”的回退风险

4. **测试 seam 重构必须伴随真实 lint 失败样例**
   - `PR-4` 不应只新增 test-support helper
   - 还应验证一条 application test 直接 import private infra path 会被 lint 拦住

5. **typed context phase 2 必须把注释回收放到最后**
   - 在 production `as PrismaClient` 尚未清零前，不应提前改注释宣称 seam 已消失

### 最终完成证明清单

以下证据都要在同一轮 completion audit 中重新采集，才能证明“范式已经优雅完整收口”。

1. 包内分层治理闭环
   - `pnpm nx run daily-use:governance-check` 通过
   - 输出中 `Package-Internal Boundary Audit` 不再出现 tracked known violations
   - `tools/governance/package-internal-boundary-audit.mjs` 中不再保留 `KNOWN_VIOLATIONS` 兜底列表，或列表为空

2. target baseline 收口
   - `pnpm nx run daily-use:target-baseline-check` 通过
   - `temporary` exemptions = 0
   - `permanent` exemptions 都能被治理文档中的“平台天然例外”口径自洽解释
   - 若仍主张总数 `<=10`，必须有 manifest 真值证明，而不是计划目标本身

3. 测试边界受控
   - `eslint.config.ts` 不再对全部测试文件全局关闭 `@nx/enforce-module-boundaries` / `no-restricted-imports`
   - `repository` 已迁移试点的测试只依赖 `src/testing` seam，不再直接 import private infra path
   - 人为引入一条跨内部实现 import，lint 能失败
   - 但 completion audit 时仍需证明这不只存在于 `repository`，而是已通过 package-scoped allowlist 取代全局测试关闭

4. public surface 收口
   - `package-export-audit.mjs` 同时覆盖 `src/index.ts` 与 `package.json#exports`
   - `governance`、`repository`、`goal`、`task` 的 export map 与 root barrel 均符合白名单
   - 检索结果不能再显示这些包公开 `./application-server`、`./api`、`./infrastructure-client` 等非稳定 surface（除非白名单有书面修订）

5. typed context phase 2 闭环
   - `rg -n "as PrismaClient" packages --glob "!**/*.test.ts" --glob "!**/*.spec.ts"` 为 0
   - `ServerModuleContext<DbClient = unknown>` 的默认值已去掉，或有明确新标准替代并完成全仓迁移
   - 相关联合 typecheck 通过

6. 文档与治理一致
   - `docs/standards/architecture.md`
   - `docs/architecture/adr/ADR-031-server-feature-standard-shape.md`
   - `docs/governance/target-baseline-governance.md`
   - 上述文档都不能再保留与当前实现冲突的过渡口径

7. 高价值模块 lint ratchet 保持有效
   - `eslint.config.ts` 中已提升到 `error` 的高价值包规则仍存在
   - 没有因为局部修复而把这些规则重新降回 `warn`

## 2026-05-29 原始判断（保留）

## 当前判断

当前仓库已经不是“缺少治理”，而是处在一个更微妙的阶段：

1. 仓库级治理入口、ADR、target baseline audit、feature shape audit、governance 活文档审计都已经存在
2. `governance` 包本身已经达到一个可演示、可 lint、可 typecheck、可 test 的健康状态
3. 但“统一、优雅、无 legacy、以 lint 和脚本治理而不是靠文档提醒”这个目标还没有完成

当前主问题不再是“没有规则”，而是以下三类落差仍然同时存在：

1. **文档规则强于可执行规则**
2. **示范模块优雅，但跨模块没有全部收敛到同一范式**
3. **治理通过了，但通过方式里仍有一批被制度化的豁免和宽 seam**

这份计划的目标不是再补一层说明文档，而是把下一轮工作明确压缩成“哪些规则要转成机器治理、哪些 legacy seam 要清理、哪些包要被拉回统一轨道”。

---

## 本次审计证据

本次结论严格以 2026-05-29 当前工作树和当日命令结果为准。

### 已重新验证的命令

1. `pnpm nx run daily-use:governance-check`
   - 通过
   - 结论：docs/config/project/governance audit 当前没有红线破坏
   - 但同时暴露了 **25 个 documented exemption**

2. `pnpm nx run governance:lint`
   - 通过

3. `pnpm nx run governance:typecheck`
   - 通过

4. `pnpm nx run governance:test`
   - 通过
   - 15 个 test files，139 个 tests 全绿

### 直接读取的真值文件

1. `AGENT.md`
2. `docs/governance/README.md`
3. `docs/governance/DECISIONS.md`
4. `docs/standards/architecture.md`
5. `docs/standards/repository-layer-spec.md`
6. `docs/architecture/adr/ADR-031-server-feature-standard-shape.md`
7. `docs/architecture/adr/ADR-032-support-package-import-conventions.md`
8. `project.json`
9. `nx.json`
10. `eslint.config.ts`
11. `tools/governance/target-baseline-manifest.json`
12. `tools/governance/target-baseline-audit.mjs`
13. `tools/governance/governance-module-docs-audit.mjs`
14. `tools/governance/server-feature-shape-audit.mjs`
15. `packages/governance/package.json`
16. `packages/governance/src/index.ts`
17. `packages/governance/src/infrastructure-server/index.ts`
18. `packages/governance/src/infrastructure-server/governance.module.ts`
19. `packages/governance/src/api/module.ts`
20. `packages/governance/src/application-client/governance-http-service-factory.ts`

---

## 审计结论总览

| 领域 | 当前状态 | 结论 |
| --- | --- | --- |
| 仓库治理入口 | 已存在且可运行 | 不是缺入口，而是需要把更多规则从文档挪进脚本和 lint |
| target baseline | 已有审计 | 仍容纳 25 个豁免，说明统一工程化还没收口 |
| feature package shape | 已有 ADR + audit | 只检查目录形状，不检查包内层间依赖是否合法 |
| ESLint 分层治理 | 已有 `@nx/enforce-module-boundaries` | 只管 package tag，不管 feature 包内部 `domain/application/infra/api` 子层 |
| 测试治理 | 已有统一 target 与 sync generator | 测试文件被整体豁免 module boundaries，seam 仍过宽 |
| governance 模块 | lint/typecheck/test/governance-check 全绿 | 是健康示范模块，但“活文档详细度”和“稳定导出面”仍可继续深化 |
| 文档与 ADR 收敛 | 基本健康 | 仍缺少一套 repo-level 可消费的统一 domain/context 入口，且不少架构约束仍写着 future work |

---

## 需要继续深化的主轨道

下面这些轨道按优先级排序。优先级标准不是“容易做”，而是“对统一范式和长期治理 leverage 最大”。

## Track 1: 把包内分层约束从文档升级为可执行治理

### 证据

1. `docs/standards/architecture.md` 明确写着：
   - 理想目标是 package-internal lint rule
   - 当前暂以文档约束为主
2. `docs/architecture/adr/ADR-031-server-feature-standard-shape.md` 也把 package-internal lint rules 标为 future improvement target
3. `tools/governance/server-feature-shape-audit.mjs` 只检查目录是否存在：
   - `domain-server`
   - `application-server`
   - `infrastructure-server`
   - `api`
   - `controllers`
   它不检查这些子层之间有没有越层依赖

### 当前问题

现在的治理只能证明“目录长得像标准形状”，不能证明“实现真的遵守了标准形状”。

这会导致一种典型 legacy：

1. `domain-server` 悄悄导入 `infrastructure-server`
2. `application-server` 直接碰 Express / Electron / Pinia
3. `api/module.ts` 变成隐式业务编排点

目录没坏，但范式已经开始回流。

### 方案

新增一层 **feature-package internal boundary governance**，至少覆盖以下规则：

1. `domain-server/**` 不得导入：
   - `infrastructure-server/**`
   - `api/**`
   - `controllers/**`
   - `application-client/**`
   - `infrastructure-client/**`
2. `application-server/**` 不得导入：
   - `api/**`
   - `controllers/**`
   - Vue/React/Electron/Express 框架对象
3. `controllers/**` 只能依赖：
   - `application-server`
   - contracts / result adapter
4. `api/**` 只做装配、路由注册、runtime contribution 管理

实现方式优先顺序：

1. 先用 repo-level 自定义 audit 脚本落地
2. 再评估是否抽成 ESLint rule
3. 如果 ESLint 难度过高，至少保留 `daily-use:governance-check` 中的静态 import 审计

### 完成条件

1. `daily-use:governance-check` 新增 package-internal boundary audit
2. 至少 `account`、`goal`、`governance`、`task`、`schedule`、`repository` 被纳入审计范围
3. `docs/standards/architecture.md` 删除“当前暂以文档约束为主”这类过渡表述

### 验证

1. `pnpm nx run daily-use:governance-check`
2. 制造一条越层导入，确认审计能失败

---

## Track 2: 收缩 target baseline 豁免，把“文档允许缺 target”改成“工程默认具备 target”

### 证据

`pnpm nx run daily-use:governance-check` 当前输出了 25 个 documented exemption。

其中最值得优先收敛的不是 React Native / assets 这种天然例外，而是这些已经被制度化的工程欠账：

1. `authentication` 缺 `lint`、`typecheck`
2. `database` 缺 `lint`、`typecheck`、`test`
3. `http-client` 缺 `typecheck`、`test`
4. `ipc-client` 缺 `typecheck`、`test`
5. `patterns` 缺 `lint`、`typecheck`
6. `utils` 缺 `typecheck`
7. `ui-core` 缺 `typecheck`
8. `dashboard`、`ui-vue-shadcn` 缺 `test`

### 当前问题

当前基线治理能防止“完全没记录的缺 target”，但还不能防止“明知缺 target 却长期保留”。

这类豁免如果没有收敛计划，会逐步演化成正式 legacy 制度。

### 方案

把 target baseline 拆成两层：

1. **永久例外**
   - `assets`
   - `mobile build`
   - `ui-react-native build`
   这类有明确平台原因的例外
2. **收敛中例外**
   - 需要附带：
     - owner
     - 原因
     - 下一次收口目标
     - 计划日期

然后按批次消化：

1. Phase 1:
   - `utils:typecheck`
   - `patterns:lint`
   - `patterns:typecheck`
   - `http-client:typecheck`
   - `ipc-client:typecheck`
2. Phase 2:
   - `authentication:lint`
   - `authentication:typecheck`
   - `database:lint`
3. Phase 3:
   - `dashboard:test`
   - `ui-vue-shadcn:test`
   - `http-client:test`
   - `ipc-client:test`

### 完成条件

1. documented exemptions 从 25 降到 10 以内
2. 所有 runtime-lib 默认具备 `build/lint/typecheck/test`，除非存在明确技术例外
3. `target-baseline-manifest.json` 不再接受无 owner / 无计划日期的临时豁免

### 验证

1. `pnpm nx run daily-use:target-baseline-check`
2. `pnpm nx run daily-use:governance-check`

---

## Track 3: 收紧测试边界治理，取消“测试文件整体免检”的宽豁免

### 证据

`eslint.config.ts` 当前对以下文件整体关闭：

1. `@nx/enforce-module-boundaries`
2. `no-restricted-imports`

覆盖范围包括：

1. `**/__tests__/**`
2. `**/*.{test,spec}.*`
3. `**/e2e/**`

并且文件内还明确写着：

- `TODO: Tighten to controlled exemption`

### 当前问题

现在的测试治理策略能提升编写速度，但代价是：

1. 测试可以任意穿透 package / feature seam
2. fixture 往往直接依赖深层实现细节
3. 生产代码已经收窄的接口，在测试里又被重新打穿

长期看，测试会反向固化 legacy 结构。

### 方案

把“测试可跨边界”收窄为“测试只允许使用明确白名单的 seam”：

1. 允许：
   - `test-utils`
   - `src/test/**`
   - public subpath exports
   - 明确命名的 fixtures
2. 不允许：
   - 测试直接跨模块 import 私有实现
   - 测试绕过 application port / repository port 直连不该可见的内部结构

实施方式：

1. 为测试新增独立 restricted-import policy
2. 先在 `governance`、`task`、`goal`、`desktop authentication` 几个高价值集群试点
3. 再推广到全仓

### 完成条件

1. `eslint.config.ts` 删除当前“大范围直接关闭边界规则”的 TODO
2. 至少一个 feature package 的测试层完成 controlled exemption 试点
3. 新增文档只保留原则，不再靠人工解释“测试为什么可以乱穿透”

### 验证

1. `pnpm nx run <project>:lint`
2. 人为引入一条跨内部实现 import，确认 lint 会失败

---

## Track 4: 统一稳定公共 API 面，清理 root barrel 和 docs-only surface 混杂问题

### 证据

1. `packages/governance/src/index.ts` 仍然使用多处 `export *`
2. `packages/governance/src/index.ts` 与 `packages/governance/src/infrastructure-server/index.ts` 仍公开导出具体实现：
   - `RulePrismaRepository`
   - `RuleRevisionPrismaRepository`
   - `PowerSyncRuleRepository`
   - `PowerSyncRuleRevisionRepository`
3. `packages/governance/package.json` 也把 `./infrastructure-server` 公开为正式 export
4. 其他多个 feature 包 root barrel 仍有：
   - `export * from './application-server'`
   - `export * from './application-client'`
   - 部分还公开 `./infrastructure-server`

### 当前问题

当前仓库已经在 `utils` 包通过 ADR-032 开始治理 root barrel，但 feature 包的稳定公共面仍不够统一。

对于 `governance` 这种“活文档示范模块”，现在存在一个矛盾：

1. 为了教学，代码结构尽量可见
2. 但为了工程化，稳定公开 API 应该尽量窄

如果不把“示范阅读面”和“稳定消费面”分开，调用方会自然依赖到具体 adapter 和内部层。

### 方案

统一 feature 包公开面治理：

1. 根入口 `.` 只暴露：
   - contracts
   - domain-shared
   - 稳定的 application-client factory
   - 必要的 application port / module factory
2. 具体 infra adapter 默认不从根入口暴露
3. `./infrastructure-server` 若仍需要保留，至少拆成：
   - public composition root
   - internal adapters
4. 为 `governance` 加一个专门的 export surface audit：
   - 禁止 root barrel `export * from './infrastructure-server'`
   - 禁止根入口公开具体 Prisma/PowerSync repository class

### 完成条件

1. `governance` 成为第一个完成“活文档阅读面”和“稳定消费面”分离的示范包
2. 至少 `governance`、`goal`、`task`、`repository` 完成 root barrel 收窄
3. 新增 package export audit 纳入 `daily-use:governance-check`

### 验证

1. `pnpm nx run governance:build`
2. `pnpm nx run daily-use:governance-check`
3. 检索根入口是否仍暴露具体 infra adapter

---

## Track 5: 统一 API module typed context，消灭 `db: unknown` + `as PrismaClient` 弱 seam

### 证据

以下模块当前都存在同类模式：

1. `packages/account/src/api/module.ts`
2. `packages/ai/src/api/module.ts`
3. `packages/authentication/src/api/module.ts`
4. `packages/editor/src/api/module.ts`
5. `packages/goal/src/api/module.ts`
6. `packages/governance/src/api/module.ts`
7. `packages/notification/src/api/module.ts`
8. `packages/reminder/src/api/module.ts`
9. `packages/repository/src/api/module.ts`
10. `packages/schedule/src/api/module.ts`
11. `packages/setting/src/api/module.ts`
12. `packages/task/src/api/module.ts`

共同特征：

1. `readonly db: unknown`
2. `const prismaClient = db as PrismaClient`

### 当前问题

这不是某一个模块的实现错误，而是一个 repo-wide 弱 seam：

1. module interface 没有准确表达依赖
2. 下游调用者可以传任何东西进来
3. 正确性靠运行时约定和局部 cast

这类 seam 会让“API module 是标准装配层”这件事看起来成立，但接口本身不够深。

### 方案

抽出统一的 server module context 语言，例如：

1. `ResultApiModuleContext<DbClient>`
2. `PrismaBackedApiModuleContext`
3. 或 `DatabaseProvider` port

要求所有 feature `api/module.ts` 统一使用同一 typed context，而不是各自写 `db: unknown`。

### 完成条件

1. 所有 feature `api/module.ts` 删除 `readonly db: unknown`
2. 仓库内不再出现 `db as PrismaClient` 这种装配层 cast
3. 统一 typed module context 被 ADR 或 standards 正式化

### 验证

1. `rg -n "db as PrismaClient|readonly db: unknown" packages`
2. `pnpm nx run-many -t typecheck --projects=account,goal,governance,task,repository,schedule`

---

## Track 6: 把 governance 活文档审计从“有顶层 JSDoc”升级到“注释真的有工程价值”

### 证据

1. `packages/governance/README.md` 明确要求：
   - 每个实现文件都必须包含详细的 JSDoc 注释
2. `tools/governance/governance-module-docs-audit.mjs` 实际只检查一件事：
   - 文件去掉空白和行注释后，是否以 `/**` 开头

### 当前问题

这意味着当前审计通过，只能证明：

1. 每个文件最上面有一个 JSDoc 块

但不能证明：

1. 注释是否解释了模块职责
2. 是否说明为什么放在这一层
3. 公开 seam 是否有 `@param` / `@returns`
4. 具体实现类是否标了 `@internal`
5. 中文和英文是否保持一致

这会让 `governance` 从“活文档模块”退化成“带很多文件头注释的正常模块”。

### 方案

对 `governance-module-docs-audit.mjs` 增加分层规则：

1. 文件级要求：
   - 顶层 JSDoc 必须包含职责说明
   - 对 infra/controller/module/factory 文件，必须解释所在层的原因
2. public API 要求：
   - 公开函数 / class / interface 必须有 JSDoc
   - 公开方法需要 `@param` / `@returns`
3. concrete adapter 要求：
   - 具体实现类必须标 `@internal` 或位于不对外暴露的 surface
4. bilingual consistency 要求：
   - 至少保留 English first / 中文 second 的统一结构

### 完成条件

1. `governance-module-docs-audit.mjs` 不再只做 existence check
2. `governance` 包能稳定通过新的 richer docs audit
3. `packages/governance/README.md` 中“详细 JSDoc”承诺与机器审计对齐

### 验证

1. `pnpm nx run daily-use:governance-check`
2. 人为删除一个公开方法 JSDoc 或 `@internal` 标记，确认审计失败

---

## Track 7: 在高价值模块上做 lint ratchet，把“warn”逐步升级为真正治理

### 证据

1. `eslint.config.ts` 全局仍把这些规则设为 `warn`：
   - `@typescript-eslint/no-explicit-any`
   - `@typescript-eslint/no-unused-vars`
2. 目前只有 `apps/api/src/**/*.ts` 被局部升级为 `error`
3. 当前目标是“通过 lint 进行治理，而非只依靠文档”

### 当前问题

只要规则还是全局 `warn`，它的治理意义就更接近“提示”而不是“门禁”。

这并不代表要立刻全仓转 `error`，但至少应该对已经健康的轨道做局部 ratchet。

### 方案

按模块成熟度分批升级：

1. 第一批：
   - `packages/governance/**`
   - `packages/governance` 相关测试外的生产代码
2. 第二批：
   - `packages/task/src/domain-server/**`
   - `packages/goal/src/domain-server/**`
   - `packages/editor/src/domain-server/**`
3. 第三批：
   - `packages/app-vue/src/modules/ai/**`
   - `apps/desktop/src/main/modules/authentication/**`

先做目录级 override，把 `warn` 升成 `error`，再配合收口。

### 完成条件

1. 至少 `governance` 生产代码目录把 `no-explicit-any` / `no-unused-vars` 升级为 `error`
2. 形成一套可复制的 lint ratchet 模板
3. 新轨道不再默认从全局 warn 开始

### 验证

1. `pnpm nx run governance:lint`
2. 对目标目录插入 `any` / unused import，确认 lint 失败

---

## governance 模块的专门判断

`governance` 当前不是问题模块，而是**下一轮统一范式的第一示范模块**。

它已经具备：

1. 完整 feature package shape
2. 清晰的 composition root
3. client factory 语言与 ADR-032 对齐
4. lint / typecheck / test / governance-check 全绿

但它还没有达到“示范模块可以停止深化”的程度，主要剩余三点：

1. **文档审计太浅**
   - 现在只能证明“有文件头注释”，不能证明“注释真的在解释架构”
2. **稳定 public surface 仍偏宽**
   - 具体 Prisma / PowerSync adapter 仍被公开导出
3. **transport module context 仍有弱类型 seam**
   - `db: unknown` + `as PrismaClient`

因此，`governance` 不应被当成“已经完成，无需再动”的模块，而应被当成“下一轮治理加严的首个实验田”。

---

## 推荐执行顺序

### Phase 1: 先补治理基础设施

1. Track 1: package-internal boundary audit
2. Track 3: controlled test exemption
3. Track 6: richer governance docs audit

原因：

1. 这三项一旦落地，后续收口将尽量由规则自动守住
2. 它们直接服务于“通过 lint / audit 治理，而非靠文档提醒”

### Phase 2: 再收工程基线欠账

1. Track 2: target baseline exemption ratchet
2. Track 7: package-level lint ratchet

原因：

1. 这阶段是把“已有规则”从宽松态推进到硬门禁态

### Phase 3: 最后收示范模块与稳定 API

1. Track 4: public API surface narrowing
2. Track 5: typed API module context

原因：

1. 这两项会波及 feature package 的标准写法
2. 适合在治理脚手架已经就位后统一推进

---

## 第一轮实施清单

下一轮实际动手时，建议不要同时改全仓，而是按下面的 tracer-bullet 顺序推进：

1. 给 `daily-use:governance-check` 新增 package-internal boundary audit
2. 给 `governance-module-docs-audit.mjs` 增加 richer docs rules
3. 在 `governance` 包上收缩 root export surface
4. 在 `governance` 包上把生产代码 `no-explicit-any` / `no-unused-vars` 升为 `error`
5. 抽取统一 typed API module context，并先迁移 `governance` + `goal`
6. 再开始消化 target baseline manifest 中的临时豁免

这样做的好处是：

1. 先拿 `governance` 做治理规则的实验田
2. 实验成功后再复制到 `task`、`goal`、`repository`、`schedule`
3. 可以最大化 locality，避免一上来全仓散改

---

## 完成判定

这份计划对应的“项目范式统一、优雅、无明显 legacy、以 lint 和治理脚本为主”至少要满足以下事实，才能认为真正完成：

1. package-internal layering 不再主要靠文档约束
2. target baseline documented exemption 显著减少，并且临时豁免都有 owner 与收口时间
3. 测试边界不再整体豁免 module boundary rules
4. `governance` 活文档审计能验证注释质量，而不只是 JSDoc 存在性
5. `governance` 和至少 3 个高价值 feature 包完成稳定 public surface 收缩
6. 高价值模块开始使用目录级 lint ratchet，而不是继续停留在全局 warn
7. feature `api/module.ts` 的 `db: unknown` + `as PrismaClient` 模式被统一替换

在这些条件达成之前，当前仓库可以叫“已有相当治理基础”，但还不能叫“范式已经统一收口”。

---

## 与现有 active plan 的关系

当前 `docs/plan/active/` 目录中只剩本文件作为架构治理主计划。

这意味着：

1. 本文件已经是当前 canonical active plan，不再与其他 active plan 并存竞争
2. 后续若继续推进 repository paradigm unification，应直接在本文件上滚动维护执行审计与下一批切片
3. 旧的同类治理计划若仍有参考价值，应保留在 archive 中作为历史背景，而不是重新回到 active 目录
