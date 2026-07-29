---
tags:
  - plan
  - branding
  - governance
description: 将仓库、代码、部署标识与文档中的旧产品身份统一迁移到 MemoFlow
created: 2026-07-29T00:00:00
updated: 2026-07-29T00:00:00
---

# MemoFlow Identity Migration

## 目标

- GitHub 仓库更名为 `memoflow`。
- Git 跟踪内容中不再出现已退役产品身份的任何变体。
- 产品展示名统一为 `MemoFlow`，机器标识统一使用 `memoflow`。
- 建立产品身份的单一事实来源与自动审计，防止旧名或错误大小写回流。

## 设计

新增根级 `product.identity.json` 作为可变产品身份的 canonical 配置，保存展示名、
slug、包 scope 与 GitHub 仓库坐标。迁移和审计脚本从该配置读取当前身份。

包名、import specifier、Nx project name、Docker service/image name、数据库名等必须在工具解析前
保持静态，不能使用运行时变量。它们统一采用 `memoflow`，并由 identity audit 对照 canonical
配置检查。这样下次改名只需先改一处配置，再运行迁移/审计，而不是依赖人工全仓搜索。

## 实施切片

1. 盘点并分类旧标识，确定展示名与机器名规则。
2. 新增 canonical identity 配置和治理审计。
3. 迁移 package scope、Nx 根项目、源码 import、配置、部署标识、文档和文件名。
4. 更新 lockfile，并执行旧名残留扫描、治理检查、类型检查及相关测试。
5. 将 GitHub 仓库更名，更新本地 `origin`，核验 fetch/push URL。
6. 完成后将本计划移入 `docs/plan/archive`。

## 完成标准

- `git grep` 与文件名扫描均找不到已退役产品标识。
- `MemoFlow` 仅用于展示名；机器标识使用 `memoflow`。
- identity audit 纳入根 `governance-check`。
- Nx project graph、lockfile、关键 typecheck/test 通过。
- GitHub 仓库与本地 remote 均指向 `BakerSean168/memoflow`。

## 完成结果

- 2,400 余个文本文件中的 package scope、import、Nx、部署和文档标识已迁移。
- 38 个品牌资源文件已统一为 `MemoFlow` 大小写。
- lockfile、Prisma Client 与 workspace 链接已刷新。
- identity audit、governance-check 和全仓 typecheck 均通过。
- GitHub 仓库和本地 `origin` 已切换到 `BakerSean168/memoflow`。
