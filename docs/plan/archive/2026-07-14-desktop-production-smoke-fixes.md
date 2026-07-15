---
tags:
  - plan
  - archive
  - desktop
  - bugfix
description: 修复 UI 重构后桌面 production 冒烟暴露的模块身份与账户空值问题
created: 2026-07-14T00:00:00+08:00
updated: 2026-07-14T00:00:00+08:00
---

# Desktop production smoke fixes

> 归档结论（2026-07-15）：修复已进入当前实现；desktop lint/typecheck/test、production build 与 Electron shell matrix 7/7 通过。

## Scope

1. 统一 `@dailyuse/app-vue` production 根入口与子入口的模块身份。
2. 让 Electron Account transport 通过 Controller 保持非空 DTO 契约，并让账户 UI 可恢复失败。
3. 删除独立 auth renderer 后不可达的 host titlebar 代码与过时说明。

## Verification

- app-vue/account/desktop 定向 lint、typecheck、test 通过。
- desktop production build 通过，认证页不再出现 `Missing injection`。
- `account:get-me` 查无本地记录时返回 `NOT_FOUND`，账户页显示重试态且不抛异常。
- Electron production 冒烟覆盖登录、主 Shell 和账户错误降级。
