---
tags:
  - plan
  - active
  - governance
  - architecture
  - lint
description: 基于 2026-05-29 当前工作树状态的仓库范式统一、治理加严与 governance 示范模块深化计划
created: 2026-05-29T00:00:00
updated: 2026-05-29T00:00:00
---

# 2026-05-29 Repository Paradigm Unification Plan

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

`docs/plan/active/2026-05-28-architecture-governance-deepening.md` 仍有参考价值，但它的关注点更偏：

1. 某些具体业务模块的收口
2. 已发生的局部重构审计

而这份新计划处理的是更高一层的问题：

1. 如何把这些局部成果固化成 repo-wide 范式
2. 如何让治理工具本身变得更强，而不是继续靠人工记忆

因此，后续如果开始按本文件推进，应考虑把 2026-05-28 那份计划转为 archive，避免 active 目录同时保留两份不同粒度、不同时间切面的“架构治理主计划”。
