---
tags:
  - plan
  - active
  - ci
  - github-actions
description: 收敛 PR CI、拆分 coverage workflow，并减少重复安装与空跑 job
created: 2026-05-01T15:20:00+08:00
updated: 2026-05-01T15:20:00+08:00
---

# CI Workflow Consolidation

## Summary

- 将 PR 主校验收敛到单一 `ci.yml`
- 将 coverage 门禁移出 PR，改为 `main` push、定时任务和手动触发
- 保留性能、发布、镜像构建等专用 workflow
- 收敛大量只会 skip 的 boundary 测试 job，并减少重复依赖安装成本

## Key Changes

- 重构 `.github/workflows/ci.yml`
  - PR 校验统一在 `ci.yml` 中完成
  - 删除 `feature/**` 的 push 触发，避免分支 push 与 PR 双触发
  - `validate` job 负责 `test:targets:check`、affected `lint`、`typecheck`、`test`、`build`
  - `boundary-tests` job 统一执行 `test:smoke`、`test:integration`、`test:ipc`、`test:main`
- 将现有 `.github/workflows/test.yml` 改造为 coverage 专用 workflow
  - 触发调整为 `push` 到 `main`、`schedule`、`workflow_dispatch`
  - 负责 `test:coverage`、`test:coverage:use-cases`、`test:coverage:prisma-mappers`、`app-vue` store coverage
- 调整 `.github/actions/setup-nx-affected-job/action.yml`
  - 增加可选输入控制 Python/uv setup
  - 增加 pnpm store 缓存
  - 默认保持 Python/uv 启用，避免 `ai-service` affected job 回归

## Validation

- 验证 workflow YAML 语法与关键触发器
- 搜索并更新仓库中对旧 `Test` workflow 的依赖引用
- 运行最小静态检查，确认 workflow 名称、引用的 action 输入和脚本路径一致

## Assumptions

- PR 不再以 coverage 作为强门禁
- `ai-service` 仍可能被主 CI affected 命中，因此主 CI setup 需要兼容 Python/uv
- GitHub 分支保护中的 required checks 需要在仓库设置中手动同步
