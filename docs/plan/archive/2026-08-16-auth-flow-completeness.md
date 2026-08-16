---
tags:
  - plan
  - archive
  - authentication
description: 诊断 Better Auth 邮箱密码流程，补齐完整契约测试并修复 Web 错误映射
created: 2026-08-16T00:00:00Z
updated: 2026-08-16T00:00:00Z
---

# Auth Flow Completeness

## Goal

用内存 Better Auth 实例固定注册、邮箱验证和登录的真实 HTTP 契约，修复 cloud-auth
客户端与 Web 场景切换对该契约的错误解释，并补齐受影响测试和类型检查。

## Confirmed Test Seams

1. Better Auth `handler` 的注册、验证与邮箱密码登录 HTTP 接口。
2. `CloudAuthHttpClient` 对 Better Auth HTTP 响应的 `Result` 映射。
3. Web `useWebAuth.loginByEmail` 对失败、待验证和已登录三种结果的场景映射。

## Steps

- [x] 建立内存 Better Auth 测试夹具并捕获当前注册、验证、错误密码和正确密码响应。
- [x] 补齐注册、重复邮箱、验证链接、登录、有效/无效/过期验证令牌矩阵。
- [x] 先添加 cloud-auth 客户端与 Web 场景的失败回归测试，再修复契约映射。
- [x] 运行 cloud-auth、app-vue、web 直接 Vitest，以及受影响项目 typecheck。
- [x] 归档本计划，提交本轮变更并记录根因与验证证据。

## Constraints

- 测试直接调用各包 Vitest 配置。
- 不修改 Docker 配置或 `.env` 文件。
- 不包含工作区中既有的 `tools/docker/local-compose.mjs`、证书或私钥变更。

## Result

- Better Auth 先校验密码：错误密码返回 `401 INVALID_EMAIL_OR_PASSWORD`，不会进入邮箱验证分支。
- 正确密码但邮箱未验证返回 `403 EMAIL_NOT_VERIFIED`；旧客户端忽略响应的 `code` 字段，Web 也未识别该明确状态。
- cloud-auth 客户端现保留 Better Auth 错误码，Web 仅将 `EMAIL_NOT_VERIFIED` 切换为验证场景，并在每次登录前清空旧验证状态。
- 重复邮箱注册在 MemoFlow HTTP guard 返回大小写归一化的 `409 USER_ALREADY_EXISTS`。
- 直接 Vitest：cloud-auth 30/30、app-vue 1024/1024、web 71/71；三个项目 typecheck、scoped lint 与 governance-check 通过。
