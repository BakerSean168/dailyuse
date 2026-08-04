# CI 测试与反馈性能

本文说明 PR CI 的当前测试拓扑、required check 契约、本地复现入口和带证据的性能快照。测试数量会随产品变化，不作为长期契约；耗时数据必须注明日期、PR 和 Actions run，不能把单次测量写成永久保证。

## 当前拓扑

`CI` workflow 先并行启动 `Validate` 和 `Detect CI Scope`。detector 使用 Nx affected 结果决定四类 Boundary 测试和 Web Flow 是否需要执行。

```text
Validate

Detect CI Scope
├─ Boundary Smoke ────────┐
├─ Boundary Integration ──┤
├─ Boundary IPC ──────────┼─ Boundary Tests
├─ Boundary Main Process ─┘
└─ Web Flow Shard 1..4 ───── Web Flow Oracle
```

两个稳定的合并门禁是：

- `Boundary Tests`：聚合所有受影响的 Boundary jobs；未受影响的子任务允许跳过，检测失败或应执行任务未成功时失败。
- `Web Flow Oracle`：聚合四个 Web Flow shard；Web Flow 未受影响时允许分片跳过，应执行时要求所有分片成功。

子任务拆分的主要目标不是减少测试覆盖，而是并行执行并让同一轮 CI 同时暴露 smoke、integration、IPC 和 Electron main-process 的失败。

## CI 做了哪些优化

### 第一阶段

- Web E2E 从单 runner 串行执行改为四个独立 runner 分片。
- `Validate` 与 Web Flow 并行，轻量 `Web Flow Oracle` 聚合分片结果。
- 每个 Web shard 使用独立 PostgreSQL；仅失败时保留 trace、video、screenshot 和报告制品。
- Boundary target 检测收敛为四次 `nx show projects --affected --with-target`。
- 保留完整核心 Web Flow 门禁，没有通过删测试换取速度。

### 第二阶段

- pnpm cache 路径从硬编码旧目录改为 `pnpm store path --silent` 的实际结果。
- 使用共享 `Detect CI Scope` 计算 Boundary target 与 Web Flow affected 状态。
- smoke、integration、IPC、main-process 拆为四个并行 jobs，由 `Boundary Tests` 聚合。
- Web Flow matrix 增加 Nx affected gate，由 `Web Flow Oracle` 区分合法跳过和异常失败。
- 增加 `pnpm ci:boundary:clean`，从当前 `HEAD` 创建临时 clean-source 快照，本地执行全部 Boundary suites 并汇总失败。

## 本地复现

日常开发仍优先运行离改动最近的 target：

```bash
pnpm nx run api:test:smoke
pnpm test:integration
pnpm nx run desktop:test:ipc
pnpm nx run desktop:test:main
pnpm nx run web:e2e
```

需要排除当前工作区残留构建产物时运行：

```bash
pnpm ci:boundary:clean --dry-run
pnpm ci:boundary:clean
```

clean-source runner 只打包当前 `HEAD`，不包含未提交改动。正式执行会重新安装依赖并启动端口 `5433` 上的临时 PostgreSQL，因此需要 Docker Engine 可用且该端口空闲。

## 性能快照

测量口径：墙钟时间从 GitHub Actions run 开始到 required jobs 完成；job 耗时包含 checkout、依赖准备、测试和 post steps。不同 runner 调度与缓存冷热会产生波动。

| 场景                    | 证据                       | 完整 PR 关键路径 |            Web E2E |               Boundary | 结果            |
| ----------------------- | -------------------------- | ---------------: | -----------------: | ---------------------: | --------------- |
| 优化前                  | PR #198                    |         约 31:00 | 单 worker 约 21:30 |                约 5:23 | 基线            |
| 第一阶段                | PR #199                    |          约 8:20 |    四分片最长 8:15 |                   0:48 | 相对基线约 -73% |
| 第二阶段，全量 affected | PR #202，run `30911692468` |             9:47 |    四分片最长 7:55 | 约 2:39（含 detector） | 相对基线约 -68% |

PR #202 首轮成功 run 的细分耗时：

| Job                   |                      耗时 |
| --------------------- | ------------------------: |
| Detect CI Scope       |                      0:54 |
| Boundary Smoke        |                      0:46 |
| Boundary Integration  |                      1:26 |
| Boundary IPC          |                      0:55 |
| Boundary Main Process |                      0:42 |
| Boundary Tests Oracle |                      0:04 |
| Web Flow shards       | 6:11 / 6:53 / 7:55 / 6:22 |
| Web Flow Oracle       |                      0:02 |
| Validate              |                      9:36 |

第二阶段不是全量场景的进一步提速：相对第一阶段，整轮从约 8:20 增至 9:47。它优先改善失败可见性、缓存路径正确性和按影响范围跳过的能力。性能判断必须同时看全量场景与实际跳过率，不能只看单个最快 job。

## 当前限制

- PR #203 的纯 `docs/test` 变更已确认会跳过 Boundary children 与 Web matrix，两个 Oracle 均成功；根配置、workspace dependency 或共享输入变更仍可能按 Nx 项目图扩大 affected 范围。
- 每个 Boundary job 都需要独立 checkout 和依赖准备。它缩短失败发现墙钟时间，但可能增加 GitHub runner 总分钟数。
- Web shards 仍各自初始化数据库、安装 Chromium 并构建 API；尚未共享 API build artifact。
- Nx remote cache、release-please 调度和 `sharedGlobals` 收敛不属于当前实现。

## 后续测量规则

每次调整 CI 拓扑后至少记录：

1. 一个全量 affected PR 的总墙钟时间、Validate、最长 Web shard 和 Boundary Oracle 完成时间。
2. 一个确定不影响 Web/Boundary 的 PR，确认子任务确实 skipped 且两个 Oracle 成功。
3. cache restore 的命中状态和 `Prepare workspace` 耗时。
4. GitHub runner 总分钟数，避免用更多并行资源换取不可接受的成本。
5. 失败重跑原因；基础设施崩溃、测试断言失败和 flaky test 必须分开记录。

历史实施背景见：

- [`2026-08-04-ci-feedback-loop-optimization.md`](../plan/archive/2026-08-04-ci-feedback-loop-optimization.md)
- [`2026-08-04-ci-feedback-loop-phase-two.md`](../plan/archive/2026-08-04-ci-feedback-loop-phase-two.md)
