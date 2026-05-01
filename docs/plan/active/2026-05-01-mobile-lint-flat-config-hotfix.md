---
tags:
  - plan
  - active
  - ci
  - mobile
  - eslint
  - hotfix
description: 修复 mobile Flat Config 与 eslint-config-expo 旧版本不匹配导致的 CI lint 失败
created: 2026-05-01T16:20:00+08:00
updated: 2026-05-01T16:20:00+08:00
---

# Mobile Lint Flat Config Hotfix

## Summary

- 修复 `apps/mobile/eslint.config.js` 使用 Flat Config，但依赖仍停留在不支持 `/flat` 的 `eslint-config-expo@7.x` 的问题
- 保持 `apps/mobile` 使用 Flat Config，不回退到 legacy `.eslintrc`
- 同步升级共享 setup action 中的 `actions/cache` 到 Node 24 运行时版本

## Key Changes

- 将 `apps/mobile/package.json` 中的 `eslint-config-expo` 升级到支持 `eslint-config-expo/flat` 的版本
- 刷新 `pnpm-lock.yaml`，确保 CI 安装出的 Expo ESLint 版本与配置匹配
- 将 `.github/actions/setup-nx-affected-job/action.yml` 中的 `actions/cache@v4` 升级为 `actions/cache@v5`

## Validation

- 验证 `require.resolve('eslint-config-expo/flat')` 可在 `apps/mobile` 下解析成功
- 运行 `pnpm exec expo lint` 验证 mobile lint
- 检查格式并确认 CI warning 来源的 `actions/cache` 已升级

## Assumptions

- `apps/mobile` 预期继续沿用 Flat Config
- Expo 55 当前可与新版 `eslint-config-expo` 协同工作
