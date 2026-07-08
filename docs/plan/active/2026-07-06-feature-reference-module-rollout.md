---
tags:
  - plan
  - active
  - architecture
  - modules
description: 以 governance 为严格参考模块，分批将其余 feature 包收敛到统一公开结构；本计划不覆盖内部 server-first 目录迁移
created: 2026-07-06T00:00:00+08:00
updated: 2026-07-07T00:30:00+08:00
---

# Feature Reference Module Rollout

## 目标

以 `packages/governance` 为唯一参考实现，将其他 feature 包逐步重构为相同的公开架构：

- 公共契约唯一真值源固定为 `@dailyuse/contracts/<feature>`
- 运行时根入口 `@dailyuse/<feature>` 只承担服务端组合根职责
- 客户端统一收敛到 `@dailyuse/<feature>/client`
- Electron main 入口统一收敛到 `@dailyuse/<feature>/electron`
- 不再公开 `domain-shared`、`domain-server`、`domain-client`、`application-client`、`infrastructure-client`、`electron-entry`

本计划的范围是“公开 seam 收敛”，不包含把各 feature 的内部目录统一迁移到
`packages/governance` 的 `src/server/*` 结构。该后续工作单独记录在
`2026-07-07-feature-internal-structure-rollout.md`。

## 统一目标公开结构

```text
@dailyuse/contracts/<feature>

@dailyuse/<feature>
@dailyuse/<feature>/api
@dailyuse/<feature>/client
@dailyuse/<feature>/electron
```

## 本轮范围

1. 验证 `packages/contracts` 内部引用已全部使用相对路径，不再使用 `@/`
2. 以 `setting` 作为首个非 governance 模块完成公开 seam 收敛
3. 同步修正调用方导入与文档说明
4. 运行定向验证，确认新公开结构可工作

## 批次策略

1. 先处理调用面较窄的模块：`setting`、`data-portability`
2. 再处理中等复杂度模块：`account`、`repository`、`schedule`
3. 最后处理高复杂度模块：`task`、`goal`、`reminder`、`notification`、`editor`、`ai`

## 完成标准

- 非 governance feature 不再对外暴露旧层名子路径
- 调用方统一通过 `client` / `electron` 新 seam 接入
- 根入口只暴露 server composition root
- 文档与 package exports 反映真实结构
- 每个完成重构的模块都具备最小定向验证结果

## 当前进展

### 已完成模块

- `setting`
- `data-portability`
- `account`
- `authentication`
- `repository`
- `editor`
- `ai`
- `notification`
- `schedule`
- `reminder`

### 已完成的额外约束

- `packages/contracts/src` 已确认不存在 `@/` 内部导入
- `schedule` 已收敛到 `root` / `api` / `client` / `electron` 主 seam；
  同时保留根入口中的最小服务端任务/仓储契约，供 `schedule-orchestration`
  以及尚未完成收敛的 `goal` / `task` / `reminder` 使用
- `reminder` 已收敛到 `root` / `api` / `client` / `electron` 主 seam；
  由于调度编排仍被外部消费，继续保留 `schedule-execution` /
  `schedule-projection` 这两个专门 seam
- `task` 已收敛到 `root` / `api` / `client` / `electron` 主 seam；
  同时保留 `analytics` / `testing` / `schedule-execution` /
  `schedule-projection` 这几个仍被实际消费的专门 seam，并已将
  调用方从 `application-client` / `infrastructure-client` /
  `electron-entry` / `domain-client` / `domain-shared` 迁移走
- `goal` 已收敛到 `root` / `api` / `client` / `electron` 主 seam；
  同时保留 `analytics` / `events` / `schedule-execution` /
  `schedule-projection` 这几个仍被实际消费的专门 seam，并已将
  调用方从 `application-client` / `infrastructure-client` /
  `electron-entry` / `domain-client` / `domain-shared` 迁移走

### 当前已知工作区阻塞

- `packages/app-vue/src/modules/governance/composables/useGovernance.ts`
  的 `RuleId` branded type 报错仍会阻塞 `app-vue:typecheck` 与 `web:typecheck`
- `desktop:typecheck` 仍会命中既有 `dashboard:build` `TS2209` 问题，和本轮模块收敛无关

### 剩余模块

- 无

### 后续非本计划范围

- 其他 feature package 的内部 `server/*` 目录迁移
- `ADR-031` 与治理脚本从 legacy / governance 双轨规则收敛到单轨规则
