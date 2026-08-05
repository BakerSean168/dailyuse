# CI 测试与反馈性能

当前 PR workflow 是 `.github/workflows/ci.yml`。`Scope Detector` 使用统一 `NX_BASE` / `NX_HEAD`
生成 versioned `test-scope-v1.json` artifact；后续 child 不重新解释 affected 范围。

稳定 required Oracle 始终出现：`Governance Oracle`、`Validate Oracle`、`Boundary Oracle`、
`Integration Oracle`、`Web Flow Oracle`、`Coverage Oracle`、`Performance Oracle`。

Oracle 使用 `tools/test-system-v2/lib/oracle.mjs` 的同一状态机：未受影响且 child skipped 是成功，
应执行但 skipped/cancelled/failed 是失败，detector failure 会 fail closed。GitHub ruleset 的 active
required contexts 由 `.github/rulesets/main.json` 声明，并由 `ruleset-check` 校验名称一致性。

Validate children（static analysis、unit、typecheck、build）并行执行。Desktop IPC 和 main 在一个
prepared Boundary runner 内分别执行；integration、smoke 和每个 Web shard 使用独立数据库环境。
真实数据库、浏览器和性能 target 均关闭 Nx cache。

Web Flow 的 21 个核心 spec 由 `apps/web/web-flow-specs.mjs` 唯一列出。
`tools/test-system-v2/web-spec-durations.json` 保存最近一次完整 V2 run 的逐 spec 测量基线，
`generate-web-shards.mjs` 据此生成 `web-shards.json`；`web-shards.test.mjs` 校验合集无遗漏、无重复。

`tools/test-system-v2/run-command.mjs` 输出结构化 timing/report，并使用
`failure-classification.mjs` 区分 assertion、infrastructure、process-crash、timeout 和 flaky；只有
明确 infrastructure 或 process crash 才自动重试一次。成功 run 不上传大体积浏览器证据，失败时保留
trace、video、screenshot 和 JSON report。

PR coverage 由 `Coverage Oracle` 门禁；`.github/workflows/coverage.yml` 的 schedule/manual 车道继续
执行完整 configured project lists，作为 affected 图漏检的 nightly 兜底。PR `test:perf` 只执行固定
seed 的排序/service budget；真实 GC、memory 和长采样在 `performance-experiment.yml` nightly 车道，
并明确要求 `--expose-gc`。

本地对应入口：

```bash
node tools/test-system-v2/inventory.mjs --check
node tools/test-system-v2/ruleset-check.mjs
node --test tools/test-system-v2/__tests__/*.test.mjs
pnpm nx run desktop:test:boundary
```

## 2026-08-05 V2 验收测量

[Actions run 30968872885](https://github.com/BakerSean168/memoflow/actions/runs/30968872885) 的七个
required Oracle 全部通过。workflow 从 `02:16:23Z` 到 `02:24:46Z`，墙钟约 8:23；所有 job 的
实际执行时间合计 2,981 秒，即 49.68 runner-minutes。该执行成本高于 42.3 分钟基线，因此不能视为
runner-minutes 目标已达成；公开仓库 billing API 返回的 0 billable milliseconds 是不同指标。

此前 run 的 Web shard 实际 job 时长为 6:48、7:29、5:53、7:11。由 JSON report 聚合的逐 spec baseline
重新分配后，四个 shard 估算测试时长为 253,478、254,607、257,794、254,664 毫秒，估算极差
4.32 秒，明显低于此前约 1:42 的观测极差。最终 run 的四个 shard 实际 job 时长为 6:44、7:03、
6:55、7:09，实际极差 25 秒。后续 run 应继续从 Actions artifact 记录墙钟、执行
runner-minutes、cache 命中和实际 shard 平衡，不把单次测量写成永久保证。

手动触发的完整 Coverage workflow [run 30970172037](https://github.com/BakerSean168/memoflow/actions/runs/30970172037)
已验证 full configured project selection 不再 false-green；它实际执行 governed domain、store 和 use-case
coverage，并在 `schedule:test:coverage:use-cases` 的 branch coverage `56.33% < 60%` 时失败。该回归保持
原 threshold，证明 nightly audit 和 coverage regression gate 都会 fail closed。

覆盖 nightly-audit 修复后的最终 PR head `c85759766` 由
[Actions run 30971373609](https://github.com/BakerSean168/memoflow/actions/runs/30971373609) 验证，七个
Oracle 全部通过；该 run 的墙钟约 8:43，job execution 合计 3,045 秒（50.75 runner-minutes）。

随后移除 Web shard 的重复 API build，并缓存 Playwright 浏览器；[run 30972424422](https://github.com/BakerSean168/memoflow/actions/runs/30972424422)
仍七个 Oracle 全部通过，但 execution 为 49.32 runner-minutes，未达到 42.3 基线。该实验保留在实现
中，因为它删除了真实重复工作，即使共享 runner 噪声使单次测量没有显著下降。
