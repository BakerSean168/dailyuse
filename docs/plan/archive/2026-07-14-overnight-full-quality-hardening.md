---
tags:
  - plan
  - archive
  - quality
  - governance
  - e2e
  - runtime
description: 全开执行质量基线、工程卫生、E2E 稳定性、架构扫描与本地部署验证
created: 2026-07-14T00:00:00Z
updated: 2026-07-15T00:00:00Z
---

# Overnight Full Quality Hardening

## 目标

完整执行过夜方案 A、B、C，产出可复核的仓库健康度报告、低风险修复、干净的计划台账和本地部署验证证据。

## 安全边界

- 不 push、不创建或合并 PR、不修改远程状态。
- 不回显、写入或提交密钥；不进行无限或批量付费 AI live eval。
- 不清空数据库或 Docker volume，不执行破坏性 reset。
- 仅自动修复规则明确、行为不变且可由测试证明的问题。
- 产品语义、公开 API、功能删除和大范围重构只记录为待决策项。

## 执行清单

### P0 质量基线

- [x] `pnpm runtime:preflight:e2e`
- [x] 全量 `pnpm lint`
- [x] 全量 `pnpm typecheck`
- [x] 全量 `pnpm test`
- [x] 核心 Web E2E 与 AI goal workflow 回归
- [x] `pnpm runtime:preflight:local-docker`
- [x] 汇总命令、退出码、症状、根因和处置到质量报告

### P1 工程卫生与 SSOT

- [x] 审计 `docs/plan/active` 中每份计划的完成标准
- [x] 将证据明确已完成或仅供历史参考的计划移至 `docs/plan/archive`
- [x] 保证 active 目录只保留真实未完成计划
- [x] 对照 `tools/runtime/profiles.json` 核对 runtime lanes 与 local Docker 文档

### P2 E2E 稳定性

- [x] 扫描全部 `networkidle` 使用
- [x] 将非必要导航等待改为 `domcontentloaded` 加显式 UI/API 等待
- [x] 核对 dashboard 退役测试、路由、菜单和文档语义
- [x] 定向重跑全部受影响 E2E 套件

### P3 治理扫描

- [x] `pnpm governance:check`
- [x] `pnpm docs:check`
- [x] `pnpm test:targets:check`
- [x] `pnpm format:check`（已执行；被既有 generated/vendor 格式基线阻塞，未做无关全仓格式化）
- [x] 扫描深路径 import、旧 event-bus/governance 双轨入口及退役 dashboard 产品入口

### P4 AI 转换层加固

- [x] 盘点 Gemini OpenAI-compatible 转换层及现有契约测试
- [x] 覆盖 `models/` 前缀、token 下限、空 content、finish reason 和 display name 边界
- [x] 运行 mock 驱动的 adapter 契约测试
- [x] 无明确模型与预算时不运行付费 live eval，并在报告中标明

### P5 Desktop 与 Docker 信心包

- [x] `pnpm build:desktop`
- [x] 回归已有 production smoke / shell E2E matrix
- [x] 按 `validate-local-deploy` skill 运行仓库本地部署验证
- [x] 检查本地 compose 服务健康状态与报告

## 当前实现状态（2026-07-15 收尾）

- 全量 lint 37 个项目成功（仅既有 warning）；typecheck 成功；test 31 个项目成功。
- Web 真 API E2E 使用全新 server 运行，53/53 通过；此前失败聚类定向复跑 24/24 通过。
- Electron shell matrix 7/7 通过；Linux Playwright 的 `basic_text` safeStorage 限制由仅作用于 disposable guest profile 的测试 codec 隔离，生产代码未降级。
- AI service 168/168 通过；OpenAI-compatible model catalog / request-response adapter 边界已补测；未运行付费 live eval。
- governance、docs、test-targets 与 desktop production build 通过；format check 的既有基线问题已记录而未批量改写。
- 已归档完成的 runtime、governance、feature seam、UI V2、desktop smoke、UI shell、event-bus 与本计划；active 仅保留未实施的 cross-feature boundary 计划。
- 本地部署验证在真实主机环境中通过：affected lint/typecheck/test 与 `pnpm docker:local:up` 均退出 `0`，报告 verdict 为 `pass`、ready for PR 为 `yes`。
- `api`、`web`、`ai-service`、`powersync` 均为 healthy；首次 Docker 镜像解包因磁盘仅余 3.8 GB 遇到 ENOSPC，安全移除可重建应用容器并清理 4.223 GB builder cache 后复验通过，数据库、PowerSync 与所有 volumes 未被清理。

## 交付物

- [x] `.tmp-overnight-quality-report.md`：P0/P1/P2 分级问题、修复和待决策项
- [x] `.tmp-overnight-logs/`：长耗时命令原始日志
- [x] `reports/local-deploy-validation/latest.md` 与 `latest.json`
- [x] 低风险修复及对应测试证据
- [x] 本计划完成后移入 `docs/plan/archive`

## 完成标准

每一项必须有当前文件、命令退出码、测试结果或运行时健康状态作为直接证据。失败但不应自动修改的项必须进入最终报告，并明确下一步与责任决策；不得以未发现明显问题替代逐项验收。

## 最终验收（2026-07-15）

- 全量 lint 37 个项目、全量 typecheck、全量 test 31 个项目通过。
- Web 真 API E2E 53/53、失败聚类复跑 24/24、Electron shell matrix 7/7、AI service 168/168 通过。
- Desktop production build、governance、docs、test-targets 通过；既有 generated/vendor format baseline 已记录，未做无关全仓改写。
- 本地部署报告生成于 2026-07-15T04:10:25Z，所有必需命令通过，四项必需服务 healthy。
- 过夜 A+B+C 范围已完成；另行维护的 cross-feature boundary hardening 计划继续保留在 active 目录。
