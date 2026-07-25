---
tags:
  - plan
  - active
description: 进行中的计划目录与当前状态
created: 2026-04-26T00:00:00
updated: 2026-07-19T19:30:00
---

# Active Plans

本目录存放仍在推进中的计划。

## 当前计划

| 计划                                                                                                | 当前状态                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Web 登录与注册页面后续优化](./2026-07-15-web-auth-page-optimization.md)                            | **大部分已落地**：访客/主题/校验/找回验证已接；法律文案与远程/e2e 验收仍待                                                                                         |
| [Web 登录后主要功能内部产品审查](./2026-07-15-web-core-product-review.md)                           | 审查材料：由统一执行方案承接                                                                                                                                       |
| [Web 登录后工作区产品与设计复审](./2026-07-16-web-product-design-review.md)                         | 第二轮审查：待转化为实施任务                                                                                                                                       |
| [Obsidian Vault 与 GitHub 知识仓库后续优化](./2026-07-16-obsidian-vault-repository-optimization.md) | **实施中**：Vault/Git runtime、Desktop pull 验收、GitHub-hosted private repo 创建、Markdown/附件投影、RAG、Link Graph、Web 创建、多实例协调已接；远程 E2E 主线至 residual 1337；待 Windows 交互式 OAuth / Desktop 本机证据 |
| [Windows vault-repo residual handoff（1338+ 提示词）](./2026-07-25-windows-vault-repo-residual-handoff.md) | **handoff 完成记录**：Windows 收尾至 residual 1342；vault §13.2 **15/15** / PR readiness **yes**（历史提示词保留） |
| [夜间 hygiene + Agent Host 持续执行](./2026-07-25-nightly-hygiene-and-agent-host.md) | **active**：vault DoD 收口后的第二代 dual/hygiene + ADR-035 夜间切片协议；**PR 跑完再合** |
| [统一助手与可插拔 Agent Host](./2026-07-17-unified-assistant-agent-host.md)                         | **实施中**（完成定义未宣称）：统一助手、右侧工作台、Workflow/Turn/Model；承接 vault 后主产品线                                                                                                       |
| [Auth + Account 收敛与安全闭环](./2026-07-17-auth-account-security-closure.md)                      | **实施中**：A–E 源码闭环；待 e2e 真跑与生产发信                                                                                                                    |

## 规则

- 新计划默认放这里
- 文件名使用 `YYYY-MM-DD-topic-slug.md`
- 计划完成、终止或只保留历史参考价值后，移动到 `../archive`
