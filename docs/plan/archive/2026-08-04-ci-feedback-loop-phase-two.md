---
tags:
  - plan
  - ci
  - developer-experience
description: 缩短 CI 反馈回路并让边界测试一次暴露全部失败
created: 2026-08-04T00:00:00+08:00
updated: 2026-08-04T21:10:00+08:00
---

# CI Feedback Loop Phase Two

## 结果

PR #202 的首轮 GitHub Actions 全部通过：`Detect CI Scope`、四类 Boundary jobs、`Boundary Tests`、四个 Web Flow shards、`Web Flow Oracle` 和 `Validate` 均成功。Boundary jobs 已确认并行启动，两个 required Oracle check 名称保持稳定。

本轮实现动态 pnpm store cache、共享 affected detector、并行 Boundary jobs、Web Flow affected gate，以及跨平台 clean-source Boundary runner。Windows `.cmd/.bat` 子进程通过 `cmd.exe /d /s /c` 启动，临时源码和数据库容器均由 runner 清理。

## 背景

前一轮修复已经降低单次 CI 时长，但串行 Boundary Tests 会在第一个失败处停止，导致同一 PR 需要多轮推送才能发现全部问题。Web Flow 四个分片对不相关变更也会完整安装、构建和执行；pnpm store 缓存路径还固定在旧版默认目录，无法保证实际命中。

本轮只处理低风险、可独立验证的反馈回路问题。release-please 调度、Nx `sharedGlobals`、remote cache 和跨 job 构建制品留给后续单独设计，避免把发布与缓存信任边界混入本次改动。

## 目标

1. composite action 从当前 pnpm 实际配置解析 store 路径，消除版本和 runner 布局假设。
2. 统一检测 affected 范围，并行执行 smoke、integration、IPC、main-process 四类 Boundary 测试。
3. 保留 `Boundary Tests` 和 `Web Flow Oracle` 两个稳定的 required check 名称，由 Oracle 聚合跳过、成功、失败和取消状态。
4. 仅当 `web`、`api` 或 `ai-service` 受影响时执行 Web Flow 分片。
5. 提供跨平台本地 clean-room Boundary 入口，在临时源码快照中安装和执行，不依赖当前工作区残留的构建产物，并一次汇总全部失败。

## 实施

### Phase A：检测与缓存

- 在 `setup-nx-affected-job` 中运行 `pnpm store path --silent`，将输出交给 `actions/cache`。
- 新建 CI affected detector，一次计算四类 Boundary target 和 Web Flow 应用影响范围，作为后续 jobs 的唯一条件来源。

### Phase B：并行 Boundary 与 Web gate

- 将四类 Boundary 测试拆成独立 jobs；integration job 独占 PostgreSQL service 并初始化 schema。
- 新增 `Boundary Tests` Oracle；检测失败或任何已触发子 job 非成功时失败，全部未受影响时成功。
- Web Flow matrix 依赖 detector；`Web Flow Oracle` 区分“未受影响而跳过”和“应执行但未成功”。

### Phase C：本地 clean-room 入口

- 新增 `tools/ci/run-clean-boundary.mjs` 与根脚本 `ci:boundary:clean`。
- 默认从当前 `HEAD` 生成临时源码快照（不包含未跟踪产物或当前工作区改动），复用 pnpm store，安装依赖后依次运行四类 Boundary target。
- integration 阶段使用独立容器和端口；所有阶段继续执行并在结尾统一报告失败。
- 无论成功或失败都清理容器和临时源码目录；不得修改当前工作区文件或删除当前工作区产物。

## 验收

- [x] 动态 pnpm store cache 已接入 composite action。
- [x] Boundary jobs 已拆分并行，Web Flow 已接入 affected gate。
- [x] `Boundary Tests` 与 `Web Flow Oracle` 名称保持不变并在 PR #202 成功。
- [x] 本地 clean-room runner、根脚本、Windows shim、`--help` 和 `--dry-run` 已完成。
- [x] `actionlint`、Prettier、`pnpm test:targets:check`、治理检查、Node 语法检查和 `git diff --check` 通过。
- [x] PR #202 首轮完整 affected CI 全绿。

## 非目标与后续

- 不在本轮改变 release-please 的触发语义。
- 不在本轮缩小 Nx 全局输入；需要先建立配置文件到项目的明确影响契约。
- 不在本轮引入 Nx Cloud 或自建 remote cache；需要先确定凭据、数据保留和缓存污染处理策略。
- 不在本轮共享 API build artifact；Web Flow 分片的制品边界与下载收益应根据真实 timing 再决定。
