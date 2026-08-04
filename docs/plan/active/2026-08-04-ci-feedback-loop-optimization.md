---
tags:
  - plan
  - active
  - ci
  - testing
description: 缩短 PR 验证关键路径，同时保留完整 Web E2E 合并门禁
created: 2026-08-04T14:30:00+08:00
updated: 2026-08-04T14:30:00+08:00
---

# CI Feedback Loop Optimization

## 1. 背景

PR #198 的最终验证关键路径约 31 分钟：Validate 串行运行约 9.5 分钟后，Web Flow
Oracle 再以单 worker 执行 74 个测试约 21.5 分钟。前三轮 Web Flow 因确定性失败、两次
重试和 30 分钟 job 上限而超时。Boundary Tests 即使没有匹配 target，也因逐项目、逐
target 调用 Nx 耗时约 5 分钟。

## 2. 决策

- 保留完整 Web E2E 作为 PR 合并门禁，不通过删除测试缩短时间。
- Web E2E 使用四个独立 runner 分片；每个分片保持单 worker 和独立 Postgres。
- 保留 `Validate` 与 `Web Flow Oracle` check 名称，避免破坏现有分支保护契约。
- Web 分片与 Validate 并行运行，由轻量 `Web Flow Oracle` job 聚合分片结论。
- PR 中确定性失败最多采集五个，CI 重试从两次降为一次。
- trace、video 和 screenshot 只保留失败证据，并上传失败分片制品。
- Boundary target 检测从 `affected projects x 4 targets` 次 Nx 启动收敛为四次
  `nx show projects --affected --with-target`。

## 3. 验收指标

- 完整 required checks 目标墙钟时间不超过 12 分钟。
- 单个 Web 分片目标不超过 10 分钟，job timeout 从 30 分钟收敛到 20 分钟。
- Boundary target 检测目标不超过 30 秒。
- 任一分片失败时 `Web Flow Oracle` 必须失败，不能误报成功。
- 四个分片合计仍枚举当前默认 Web E2E 的全部测试。
- 本地 Playwright 配置不启用 CI 专属 fail-fast 或 retry。

## 4. 验证

1. 校验 workflow YAML 与 Prettier 格式。
2. 运行 Playwright `--list`，分别枚举四个 shard，并验证合集与未分片列表一致。
3. 运行测试目标治理与 MemoFlow governance check。
4. 推送 PR，以真实 GitHub Actions 时长作为最终性能验收。
