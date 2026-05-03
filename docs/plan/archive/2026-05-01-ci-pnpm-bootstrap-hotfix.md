---
tags:
  - plan
  - active
  - ci
  - github-actions
  - hotfix
description: 修复 setup-node 在 pnpm 尚未进入 PATH 时尝试启用 pnpm cache 导致的 CI 启动失败
created: 2026-05-01T15:50:00+08:00
updated: 2026-05-01T15:50:00+08:00
---

# CI pnpm Bootstrap Hotfix

## Summary

- 修复 `.github/actions/setup-nx-affected-job/action.yml` 中的 pnpm 启动顺序错误
- 保留 pnpm store 缓存，但改为仓库中已验证可用的 `actions/cache` 模式
- 不改动 `ci.yml` 与 `coverage.yml` 的测试编排逻辑

## Key Changes

- 移除 `actions/setup-node@v6` 上的 `cache: pnpm`
- 保留 `corepack enable` 作为 pnpm 初始化入口
- 在 `Setup pnpm` 之后新增 `actions/cache@v4`，缓存 `~/.local/share/pnpm/store/v3`
- 继续使用 `pnpm-lock.yaml` 作为缓存 key 的哈希输入

## Validation

- 验证 composite action 语法
- 运行格式检查
- 确认 `Prepare workspace` 阶段不再依赖尚未初始化的 `pnpm`

## Assumptions

- 当前 GitHub Actions 故障由 pnpm bootstrap 顺序引起
- 修复 bootstrap 后，若还有后续失败，再单独处理下一个故障点
