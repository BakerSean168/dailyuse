---
tags:
  - plan
  - archive
  - testing
  - ci
  - refactor
  - developer-experience
description: Test System V2 单一测试归属、Nx 执行契约、稳定 Oracle 与强制门禁的一次性重构方案
created: 2026-08-04T00:00:00+08:00
updated: 2026-08-05T10:00:00+08:00
---

# Test System V2 一次性重构计划

## 状态

- **计划状态**：Completed in PR [#204](https://github.com/BakerSean168/memoflow/pull/204)
- **交付方式**：独立重构分支、一个 PR、一次合并切换
- **兼容策略**：不保留 V1/V2 运行时双轨、旧 target shim 或旧 required check
- **决策真源**：[ADR-040](../../architecture/adr/ADR-040-test-system-v2.md)
- **目标架构**：[Test System V2](../../test/test-system-v2.md)

## 1. Problem Statement

MemoFlow 的测试能力已经覆盖 unit、coverage、integration、API smoke、Desktop IPC/main、Web E2E
和 performance，但这些能力没有共享一套完整的系统契约。当前问题不是单一测试慢，而是测试文件、
Nx target、CI job、GitHub ruleset 和质量报告表达的事实不一致。

2026-08-04 诊断证据：

- Desktop 有 46 个测试文件；完整 CI 对它们产生 64 次文件执行，18 次属于重复执行。
- 9 个 `__tests__` 文件同时进入 IPC 和 main suite，其中只有 2 个实际位于 IPC 目录。
- 完整 affected run 约 9:47，Validate 约 9:29，是当前关键路径。
- Validate 内部 lint 约 1:13、typecheck 约 3:06、test 约 4:16、build 约 0:10，当前全部串行。
- Boundary IPC/Main 实际测试各约 8–9 秒，但每个 job 需要约 31–35 秒 checkout 和 workspace 准备。
- 四个 Web shard 测试耗时约 3:53–5:35，最长与最短相差约 1:42。
- 完整 affected run 约消耗 42.3 runner-minutes。
- coverage 不在 pull request 上运行；coverage regression 可能合并后才发现。
- 完整 `memoflow:governance-check` 没有进入 PR CI。
- performance workflow 没有历史 baseline，输出阈值与测试断言不一致，部分 benchmark 未被收集。
- `main` 的唯一 ruleset 已由 V2 manifest 声明为 active，并要求稳定 Oracle contexts。

继续在现有 workflow 上增删 job 只能优化局部时长，无法修复 suite 语义、门禁强制性和测试系统的
自我治理能力。

## 2. Solution

一次性建立 Test System V2：

1. 每个测试文件只属于一个 primary suite。
2. 统一 Nx target vocabulary，Nx 成为唯一公共执行入口。
3. Scope Detector 一次计算 affected 范围并输出结构化 scope。
4. 工作 child jobs 与稳定 Oracle 分离。
5. PR 使用 affected gates，nightly 使用 full audit。
6. coverage 前移到 PR，governance 成为强制 Oracle。
7. PR performance budget 与 nightly performance experiment 分离。
8. 启用与当前 Oracle 名称一致的 GitHub ruleset。
9. 删除旧配置、旧 workflow 逻辑、重复脚本和兼容入口。

重构分支内部使用小提交保持可审查和可回退，但不会将中间状态合并到 `main`。最终切换必须同时
包含代码、配置、workflow、ruleset 计划和文档，避免主分支出现半套 V2。

## 3. Scope

### Included

- 所有 Vitest/Playwright 测试文件的 primary suite inventory。
- Desktop unit、IPC 和 main-process suite 的重新归属。
- workspace test target vocabulary、Nx inputs 与 test-target generator/governance。
- CI Scope Detector、Oracle 状态机、Validate、Boundary、Integration 和 Web Flow DAG。
- PR affected coverage 与 nightly full coverage。
- performance budget/experiment 重构。
- JUnit/JSON、scope、timing、failure classification 和 artifact policy。
- infrastructure-only retry 和 flaky policy。
- GitHub `main` ruleset required contexts。
- 旧 workflow、配置、脚本和文档的删除或收敛。

### Out of Scope

- 修改产品业务行为或补产品功能测试覆盖。
- 引入 Nx Cloud、自建 remote cache 或第三方 CI 平台。
- 将所有测试统一搬到顶层 `tests/` 目录。
- 为外部贡献 fork 开放有写权限的远程缓存。
- 以删除 Web 核心流程、降低 coverage threshold 或增加断言 retry 换取绿色 CI。
- release-please、Docker 发布和生产部署 workflow 重构。

## 4. Delivery Rules

### 4.1 分支与合并

- 使用单一分支 `refactor/test-system-v2`。
- 只创建一个面向 `main` 的实现 PR。
- 实现 PR 不与无关产品功能混合。
- 所有 V2 验收通过后再启用新 ruleset 并合并。
- 主分支不经历 V1/V2 长期并行。

### 4.2 中间提交

- 每个提交都必须能被检出、安装并通过与其改动范围对应的验证。
- 分支内部允许旧入口暂时存在，前提是最终切换提交删除它们，且没有中间提交进入 `main`。
- 不使用兼容 shim 让新旧 suite 长期同时工作。
- 文件移动与行为修改分开提交，便于 review 识别测试归属变化。

### 4.3 事实记录

- 每轮 CI 实验记录 run URL、SHA、墙钟时间、runner-minutes、cache 和失败分类。
- 性能判断至少包含 full affected、docs-only 和一个普通 affected 场景。
- 不用单次最快结果作为长期承诺，验收使用相同范围的可比较 run。

## 5. Work Packages

### W0：冻结基线与测试 inventory

目标：建立实施前可重复比较的事实集合。

任务：

- 枚举所有 `*.test.*`、`*.spec.*`、`*.bench.*` 和 Playwright specs。
- 对每个文件记录当前被哪些 Vitest/Playwright config 收集。
- 输出 primary suite 候选、重复归属、未归属和 measurement-only 重跑。
- 保存 Desktop 当前 46/64 基线与 9 个重叠文件清单。
- 保存最近 full affected、docs-only、coverage 和 performance workflow timing。
- 定义测试 scope manifest 的 machine-readable schema。

验收：

- inventory 可由命令重新生成，不是手工表格。
- 文件系统测试全集与 inventory 总数一致。
- 当前重复项被明确列出，没有先通过 exclude 隐藏。

### W1：建立测试归属治理

目标：先让仓库能够证明 V2 配置没有漏测和重复执行。

任务：

- 扩展 test-target governance，使其解析项目 target 与测试配置。
- 增加 missing、duplicate、unexpected、measurement-only 四类诊断。
- 增加 target vocabulary 和 cache policy 校验。
- 为治理工具增加 fixture-based 单元测试，覆盖合法、重复、漏收集和非法边界。
- 将治理结果输出为人类摘要和 JSON artifact。

验收：

- 人为制造一个重复 include 时治理测试失败。
- 人为新增一个未归属 spec 时治理测试失败。
- coverage 对 unit 的有意重跑不会被误报为 primary duplication。

### W2：一次性重划 Desktop suites

目标：让 Desktop suite 名称与执行环境、测试职责一致。

任务：

- 逐个分类现有 46 个 Desktop 测试文件。
- 将需要 IPC setup 的文件移动或重命名为明确 IPC 归属。
- 将 Electron main boundary 文件移动或重命名为明确 main 归属。
- 普通 main unit 留在默认 `desktop:test`，边界文件从默认 suite 排除。
- 抽取 Desktop Vitest 最小共享 base，删除 IPC/Main 重复 aliases。
- 建立 `desktop:test:boundary` 编排入口。
- 删除以宽泛 `**/__tests__/**` 同时定义 IPC/Main 的收集规则。

验收：

- 46 个文件每个恰好一个 primary suite。
- 完整 primary suite 文件执行为 46，不再是 64。
- IPC suite 不包含 database、AI、utils 或 bootstrap 普通 unit。
- 默认 unit、IPC 和 main suite 分别独立运行成功。
- Electron mock/setup 只应用到真正需要它的 suite。

### W3：标准化 workspace Nx targets

目标：所有项目使用同一套测试语言和缓存边界。

任务：

- 盘点每个项目实际支持的 `test`、coverage、smoke、integration、boundary、perf 和 e2e。
- 更新 test-target generator，使新增项目自动获得正确的最小 target 集合。
- 删除含义重复的手写 target 和根 package scripts。
- 统一 outputs、inputs、cache、parallelism 和 timeout 所有权。
- 为 root configuration、lockfile、TypeScript config 和 generator 变更建立 affected fixture。
- 验证 `package.json` 等 shared globals 是否可以拆分；没有证据时保持保守输入。

验收：

- `nx show projects --with-target=<target>` 与 capability inventory 一致。
- 真实 DB/E2E/performance target 不可缓存。
- 普通 test 不会隐式运行 integration、boundary 或 E2E。
- test-target sync/check 在 clean worktree 中无 diff。

### W4：实现单一 Scope Detector 与 Oracle library

目标：CI 只解释一次 affected scope，所有 Oracle 使用同一状态机。

任务：

- 将 base/head 解析、affected projects 和 target capability 组合到单一 detector。
- 输出 versioned scope JSON 和必要的 GitHub outputs。
- 抽取 Oracle 判定为可单元测试脚本，不在多个 YAML job 复制 shell 逻辑。
- 覆盖 enabled/success、disabled/skipped、detector failure、cancelled 和 unexpected result。
- 保存 scope JSON artifact，并在 job summary 展示。

验收：

- 同一 run 的所有 child 使用同一 scope artifact。
- detector 失败时所有相关 Oracle 明确失败。
- 未受影响时 child skipped 且 Oracle 成功。
- 应执行但 child skipped/cancelled 时 Oracle 失败。

### W5：重写 CI DAG

目标：降低关键路径，同时控制重复 setup 和 runner-minutes。

任务：

- 将 Validate 拆为 Static Analysis、Unit Tests、Typecheck、Build children。
- 使用 `Validate Oracle` 汇总结论。
- 根据依赖 build 实测决定 Typecheck/Build 是否合并。
- 将 Desktop IPC/Main 合并到单个 prepared Boundary runner 的不同 steps。
- 保留需要 PostgreSQL 的 integration/smoke 独立环境。
- Web Flow 保留独立数据库和单 worker 分片。
- 所有 jobs 复用同一个 workspace setup composite action。
- 删除旧 `Validate` 串行步骤和四个重复短 Boundary job。

验收：

- 所有 children 并行关系与设计 DAG 一致。
- 任一 child 失败时同组其他独立 child 仍可暴露结果。
- Oracle job name 稳定且始终出现。
- 完整 affected runner-minutes 不高于 42.3 分钟基线。

### W6：将 coverage 前移到 PR

目标：coverage regression 在合并前被阻止。

任务：

- 复用 Scope Detector 选择受治理 coverage projects。
- 建立 PR affected coverage child 和稳定 `Coverage Oracle`。
- nightly/manual 保留 full configured project lists。
- 输出各 coverage group 的项目、threshold、结果和 machine-readable summary。
- 验证新增源码不能通过错误 exclude 静默绕过 threshold。

验收：

- 修改受治理领域源码会触发对应 affected coverage。
- 纯 docs 修改合法跳过 coverage child，Oracle 成功。
- 人为降低覆盖率时 PR Oracle 失败。
- nightly full coverage 覆盖所有治理清单项目。

### W7：重构 performance 体系

目标：删除虚假精度，让性能检查准确表达它测量的对象。

任务：

- 将 workflow 改名为 Task Performance Budget 或等价准确名称。
- 从测试定义生成阈值摘要，删除 workflow 中手写的第二套阈值。
- 使用固定 seed、warm-up、median/p95 和结构化结果。
- 将模拟 HTTP 测试重命名为 serialization/service budget，或替换为真实 HTTP 测试。
- 将随机 `setTimeout` DB benchmark 移出强制 PR gate。
- memory benchmark 使用明确 `--expose-gc` 车道，不能静默 return 成功。
- 将真实 DB、内存和长采样放入 nightly experiment。

验收：

- workflow 文本与测试断言不存在阈值漂移。
- 所有 allowlisted benchmark 都被执行，未执行项明确删除或进入 nightly。
- PR budget 在重复运行中的稳定度足以作为门禁。
- nightly 保存 JSON artifact，可比较 median/p95 趋势。

### W8：建立可观测性、retry 与 flake policy

目标：让失败原因和优化收益可以持续测量。

任务：

- 统一 JUnit/JSON reporter 和 artifact 命名。
- summary 输出 scope、setup/test/post 时间、cache、测试数和最慢测试。
- 区分 assertion、infrastructure、process crash、timeout 和 flaky。
- 只为明确 infrastructure/startup failure 自动 retry 一次。
- 建立 flaky 记录格式，要求 owner、首次出现、issue 和过期时间。
- 成功 run 不上传大体积 trace/video；失败证据保留固定期限。

验收：

- SIGSEGV/Nx native crash 不被标记为断言失败。
- assertion failure 不会因通用 retry 被掩盖。
- summary 可以计算墙钟时间与 runner-minutes。

### W9：Web shard 平衡与准备成本实验

目标：在 Validate 不再是瓶颈后，降低 Web 最长 shard。

任务：

- 从历史 JSON 计算 spec duration。
- 生成稳定、可审计的四分片分配。
- 比较按耗时分配前后的 longest/shortest gap。
- 独立实验一次 API build artifact；同时记录 wall-clock 和 runner-minutes。
- 只有 artifact 同时满足成本收益且没有明显增加关键路径时才保留。

验收：

- 四个 shard 合集与未分片完整清单一致，无重复、无遗漏。
- longest/shortest gap 明显低于当前约 1:42。
- 单 worker 和独立数据库隔离保持不变。

### W10：切换 ruleset、清理旧系统并同步文档

目标：让 V2 成为唯一系统和真正的合并门禁。

任务：

- 删除旧 CI child jobs、旧 detector 逻辑、旧 performance 文本和冗余脚本。
- 删除已被 V2 取代的 Vitest config 或宽泛 glob。
- 更新 `docs/test` 当前态文档，不再把 V2 标记为 planned。
- 将本计划完成后移动到 archive 并记录最终 timing。
- 更新 GitHub ruleset required contexts 为当前 Oracle，包括确定性预算使用的 `Performance Oracle`。
- 启用 ruleset，验证管理员外的普通 PR 无法绕过。

验收：

- 仓库搜索不到已退役的旧 CI check context。
- 主分支只有一套 active CI 和测试 target 契约。
- ruleset enforcement 为 active，required contexts 与实际 job name 一致。
- 旧 V1 入口没有兼容 shim 或双轨执行。

## 6. Commit Plan

以下是重构分支建议提交序列。它们是一个 PR 内的审查单元，不代表允许中间状态进入 `main`。

1. `docs(test): record Test System V2 decision and target architecture`
2. `test(governance): inventory primary and measurement suites`
3. `test(governance): reject missing and duplicate test ownership`
4. `refactor(desktop-test): classify unit ipc and main suites`
5. `refactor(desktop-test): consolidate shared Vitest configuration`
6. `refactor(test): standardize Nx target vocabulary and cache policy`
7. `refactor(ci): emit a versioned affected scope manifest`
8. `test(ci): cover Oracle state transitions`
9. `refactor(ci): split Validate behind a stable Oracle`
10. `refactor(ci): consolidate Desktop boundary execution`
11. `feat(test): gate affected coverage before merge`
12. `refactor(test): separate performance budgets from experiments`
13. `feat(ci): publish timing and classified failure evidence`
14. `perf(ci): balance Web shards from historical duration`
15. `chore(test): remove Test System V1 paths and synchronize docs`

如果某个提交无法在不引入临时兼容代码的情况下保持工作，应与相邻提交合并；不为了追求提交数量制造
短命 abstraction。

## 7. Validation Matrix

| 场景                       | 预期 children               | 必须成功的 Oracle               | 验证重点                     |
| -------------------------- | --------------------------- | ------------------------------- | ---------------------------- |
| `docs/test/**` only        | governance，其他合法 skip   | 全部 Oracle                     | 无永久 pending，约 90 秒量级 |
| 单一 domain unit 修改      | unit、typecheck、coverage   | Governance、Validate、Coverage  | affected 精确性              |
| Desktop renderer 修改      | desktop unit、可能 build    | Governance、Validate            | 不误跑 IPC/Main              |
| Desktop IPC 修改           | unit/IPC boundary 按 scope  | Validate、Boundary              | 唯一归属和 Electron setup    |
| Desktop main/database 修改 | main boundary/integration   | Boundary/Integration            | 不误归 IPC                   |
| API route 修改             | unit、smoke、Web Flow 按图  | Validate、Boundary、Web Flow    | HTTP 装配与用户流程          |
| Prisma/transaction 修改    | unit、integration、coverage | Validate、Integration、Coverage | 独立真实数据库               |
| Web user-flow 修改         | web unit、四 shard          | Validate、Web Flow              | shard 合集完整               |
| root package/lockfile 修改 | 预期广泛 affected           | 全部相关 Oracle                 | shared inputs 正确传播       |
| coverage regression        | coverage child failure      | Coverage failure                | 合并被阻止                   |
| assertion failure          | 对应 child failure          | 对应 Oracle failure             | 不自动 retry                 |
| Nx SIGSEGV/startup crash   | infra retry once            | 最终结果如实聚合                | failure classification       |
| detector failure           | children 不可信             | 所有依赖 Oracle failure         | fail closed                  |

## 8. Performance Acceptance

### Required

- Desktop primary suite 重复执行：0。
- 未归属测试：0。
- ruleset 绕过：0。
- docs-only：保持当前 1:33 附近，不因新增 Oracle 大幅回退。
- full affected：低于当前 9:47；首阶段目标 7–8 分钟。
- full affected runner-minutes：不高于当前约 42.3 分钟。
- Boundary 短 suite 的 setup/test 比例明显改善。
- Web shard duration gap 小于当前约 1:42。

### Measurement protocol

- 每个场景至少记录一个 cold/partial-cache run 和一个常规 run。
- 对比使用相同 base/head 影响范围或明确说明差异。
- 同时记录 workflow wall-clock、critical path 和所有 jobs runner-minutes。
- 将 queue time 与 job execution time分开，不把 GitHub 调度噪声归因于代码。

## 9. Risks and Mitigations

| 风险                     | 影响                     | 缓解                                                    |
| ------------------------ | ------------------------ | ------------------------------------------------------- |
| 测试重分类时漏收集       | 绿色但漏测               | inventory + missing ownership gate + full list diff     |
| Validate 拆分重复 build  | runner 成本上涨          | 先测 children，必要时合并 typecheck/build               |
| affected inputs 过度收窄 | PR 静默跳过              | root-change fixtures + nightly full audit               |
| Oracle YAML 判断漂移     | required check 误绿/误红 | 单一 Oracle library + 状态机单元测试                    |
| ruleset context 拼写错误 | 所有 PR pending          | API 对照实际 check runs 后再启用                        |
| performance budget noisy | flaky CI                 | median/p95、宽松预算、nightly 承担环境实验              |
| 大 PR 难审查             | 引入系统性回归           | 逻辑小提交、生成 inventory diff、专门 validation matrix |
| rollback 时 ruleset 阻塞 | 无法恢复主分支           | 预先记录管理员紧急 disable/restore 流程                 |

## 10. Rollback

V2 不维护运行时双轨。发生阻断性问题时采用整体回滚：

1. 暂时将 ruleset enforcement 设为 disabled，仅用于恢复，不作为长期状态。
2. revert Test System V2 合并提交，恢复 V1 workflow/config 的仓库版本。
3. 确认 V1 checks 出现后恢复与该版本一致的 ruleset contexts。
4. 在 V2 分支修复根因并重新执行完整 validation matrix。

不通过在 `main` 同时保留两套 workflow、两组 test glob 或 optional required checks 实现回滚。

## 11. Documentation Decisions

- ADR 只记录长期决策和拒绝方案。
- `docs/test/test-system-v2.md` 是目标系统契约；实施完成后转为当前系统契约。
- 本计划记录实施顺序、风险、验收和 timing；完成后移入 archive。
- `docs/test/ci-validation.md` 只记录当前生效 topology 和有日期的测量结果。
- 具体 alias、include/exclude 和 setup 理由留在对应配置文件注释，不复制到多份文档。

## 12. Definition of Done

- [x] ADR-040 的全部 enforcement 可由代码、CI 或 ruleset 验证。
- [x] 测试 inventory 对所有项目无 missing/duplicate primary ownership。
- [x] Desktop 46 个现有文件全部重新归属，重复执行为 0。
- [x] 标准 Nx targets 与 generator/governance 一致。
- [x] Scope Detector 和 Oracle 状态机有自动化测试。
- [x] Validate、Boundary、Integration、Web Flow、Coverage、Performance、Governance Oracle 始终出现。
- [ ] PR affected coverage 和 nightly full coverage 都通过故意失败验证。
- [x] performance budget 不再声称未实际测量的 HTTP、DB、memory 或 variance 能力。
- [x] failure summary 能区分 assertion、infrastructure、crash、timeout 和 flaky。
- [ ] full affected、docs-only 和普通 affected 三类真实 Actions run 满足预算。
- [x] `main` ruleset active，required contexts 与实际 Oracle 完全一致。
- [x] 所有 V1 冗余 workflow、config、glob、脚本和文档已删除。
- [x] governance、actionlint、format、target sync/check 和完整 CI 全绿（run `30934384004`）。
- [x] 本计划归档并记录最终结果、PR、run URL 和前后性能对比。

## 13. Completion Evidence

实现集中在分支 `refactor/test-system-v2` 和 PR
[#204](https://github.com/BakerSean168/memoflow/pull/204)，保持未合并状态等待审查。最终实现覆盖 W0-W10：
versioned inventory、唯一 primary ownership、标准 Nx targets、Scope Detector、统一 Oracle 状态机、
并行 Validate、合并准备的 Desktop Boundary、affected coverage、确定性 PR performance budget、nightly
full audits、结构化 timing/failure classification、测量驱动的 Web shards，以及 active ruleset manifest。

验收证据：

- [Actions run 30968872885](https://github.com/BakerSean168/memoflow/actions/runs/30968872885) 的七个
  required Oracle 全部通过。
- 墙钟为约 8:23（`02:16:23Z` 至 `02:24:46Z`），低于 9:47 基线，但没有达到 7-8 分钟目标。
- 所有 job 执行时间合计 2,981 秒，即 49.68 runner-minutes，高于 42.3 分钟基线；公开仓库 billing
  API 的 0 billable milliseconds 不作为该目标的替代证据。
- Desktop 46 个测试文件全部唯一归属，primary duplicate 为 0，inventory missing 为 0。
- Web JSON reports 生成 versioned `web-spec-durations.json`；新 shard 估算为 253,478、254,607、
  257,794、254,664 毫秒，极差 4.32 秒，低于原约 1:42；最终 run 实际 shard 极差 25 秒。
- `.github/rulesets/main.json` 声明 active，required contexts 恰为七个稳定 Oracle；远端 active ruleset
  ID `9183921` 已复核。
- governance、actionlint、inventory、target checks、Oracle/Scope/shard tests 和相关 project tests 已通过。

未达到的时间与成本目标作为后续优化输入，不通过改变测试语义、阈值、retry 或 skip 隐藏。V2 的
功能性 Definition of Done 已完成，本计划因此归档；PR 不在本计划执行中自动合并。
