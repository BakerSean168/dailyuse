---
tags:
  - product
  - feature-map
description: 当前核心功能地图
created: 2026-06-02T00:00:00
updated: 2026-07-17T00:00:00
---

# 功能地图

本页用于建立当前系统的全局功能视角。状态只表达文档盘点状态，不等同于代码质量或业务优先级。

## 模块列表

| 模块           | 功能点                                                                    | 业务目标                                    | 当前状态                  | 相关代码入口                                                                                                             | 备注                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标模块       | 目标管理、关键结果、目标记录、目标复盘、专注模式、多目标对比、AI 创建目标 | 帮助用户制定、执行、追踪和复盘目标          | 样板已盘点                | `packages/goal`、`packages/app-vue/src/modules/goal`、`apps/mobile/src/app/goals`                                        | 见 [目标模块说明](./modules/goal.md) 和 [文件索引](./module-index/goal-files.md)                                                                                    |
| 任务模块       | 任务模板、任务实例、任务依赖、任务与目标绑定、DAG 与关键路径              | 承接用户日常行动和目标拆解                  | 已盘点                    | `packages/task`、`packages/app-vue/src/modules/task`、`apps/mobile/src/app/tasks`                                        | 见 [任务模块说明](./modules/task.md) 和 [文件索引](./module-index/task-files.md)                                                                                    |
| 日程模块       | 日程任务、周视图、日历视图、冲突检测、调度执行                            | 把任务、目标和提醒落到时间安排              | 已盘点                    | `packages/schedule`、`packages/app-vue/src/modules/schedule`、`apps/mobile/src/app/schedule`                             | 见 [日程模块说明](./modules/schedule.md) 和 [文件索引](./module-index/schedule-files.md)                                                                            |
| 提醒模块       | 提醒模板、提醒分组、提醒偏好、触发记录、频率调整                          | 帮助用户按配置收到行动提醒                  | 已盘点                    | `packages/reminder`、`packages/app-vue/src/modules/reminder`                                                             | 见 [提醒模块说明](./modules/reminder.md) 和 [文件索引](./module-index/reminder-files.md)                                                                            |
| 通知模块       | 通知中心、通知偏好、通知模板、桌面通知、SSE 实时推送                      | 统一承载系统通知和用户提醒触达              | 已盘点                    | `packages/notification`、`packages/app-vue/src/modules/notification`                                                     | 见 [通知模块说明](./modules/notification.md) 和 [文件索引](./module-index/notification-files.md)                                                                    |
| Dashboard 模块 | 仪表盘投影、统计卡片、趋势图、小组件、配置持久化                          | 汇总用户当前状态和关键行动入口              | 已盘点                    | `packages/dashboard`、`packages/app-vue/src/modules/dashboard`                                                           | 见 [Dashboard 模块说明](./modules/dashboard.md) 和 [文件索引](./module-index/dashboard-files.md)                                                                    |
| 资源库模块     | 本地 Vault、GitHub private repo、Git 同步、Web 快捷创建、搜索与反链       | 连接 Obsidian/GitHub 知识资产与 Memory Flow | 目标态已决策，待迁移      | `packages/repository`、`packages/app-vue/src/modules/repository`                                                         | 见 [ADR-034](../architecture/adr/ADR-034-obsidian-vault-repository.md)、[资源库模块说明](./modules/repository.md) 和 [文件索引](./module-index/repository-files.md) |
| 编辑器模块     | 安全 Markdown 预览、路径确认、AI 引用、Obsidian 外部打开                  | 提供跨端知识呈现和新笔记确认                | 运行时包已退役；职责落在 repository 工作区 | `packages/app-vue/src/modules/repository`、`packages/app-vue/src/shared/utils/safe-markdown.ts`、`packages/repository`   | 见 [编辑器模块说明](./modules/editor.md) 和 [文件索引](./module-index/editor-files.md)                                                                              |
| AI 模块        | AI Chat、目标生成、目标自动化、知识笔记、模型选择                         | 用 AI 辅助用户整理上下文并生成结构化行动    | 已盘点                    | `packages/ai`、`packages/app-vue/src/modules/ai`、`apps/ai-service`                                                      | 见 [AI 模块说明](./modules/ai.md) 和 [文件索引](./module-index/ai-files.md)                                                                                         |
| 账户模块       | 账户中心、用户资料、账户管理、Profile 编辑                                | 管理用户业务资料                            | 已盘点                    | `packages/account`、`packages/app-vue/src/modules/account`                                                               | 见 [账户模块说明](./modules/account.md) 和 [文件索引](./module-index/account-files.md)                                                                              |
| 认证模块       | 账密、GitHub 登录、访客、会话、离线 profile                               | 管理用户身份认证，并与 GitHub 仓库授权解耦  | GitHub 服务端骨架已落地   | `packages/authentication`、`packages/app-vue/src/modules/authentication`、`apps/desktop/src/main/modules/authentication` | 见 [认证模块说明](./modules/authentication.md) 和 [文件索引](./module-index/authentication-files.md)                                                                |
| 设置模块       | 外观、语言、AI、隐私、快捷键、通知、实验功能                              | 管理用户偏好配置                            | 已盘点                    | `packages/setting`、`packages/app-vue/src/modules/setting`                                                               | 见 [设置模块说明](./modules/setting.md) 和 [文件索引](./module-index/setting-files.md)                                                                              |
| 治理模块       | 规则管理、状态流转、修订历史、代码示例、搜索                              | 管理产品内治理规则                          | 已盘点                    | `packages/governance`、`packages/app-vue/src/modules/governance`                                                         | 见 [治理模块说明](./modules/governance.md) 和 [文件索引](./module-index/governance-files.md)                                                                        |

## 当前重点优化前置资产

1. 目标模块：已经建立样板底图。
2. 任务模块：已完成盘点，承接目标拆解和日常执行。
3. 日程模块：已完成盘点，处理跨模块调度和时间安排。
