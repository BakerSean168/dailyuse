---
tags:
  - plan
  - active
  - build
  - monorepo
  - typescript
description: 统一 monorepo 开发态源码引用与构建态产物引用的配置规范
created: 2026-05-16T00:00:00
updated: 2026-05-16T00:00:00
status: active
---

# Monorepo 统一构建规范实施方案

## 目标

将仓库统一到一条边界规则：业务代码只导入稳定包名，开发态解析到 workspace `src`，构建态解析到包 `exports` 与 `dist`。

## 实施摘要

- 根 `tsconfig` 拆成编译基线与开发态 workspace 源码 alias 两层
- 复杂业务库改为 `tsup` 产 JS，`tsc --emitDeclarationOnly` 产 DTS
- 轻量库继续用 `tsup` 产 DTS，但显式切断开发态 workspace alias
- 应用继续保留开发态源码白名单，生产构建保持真实包边界

## 验收标准

- 复杂库 build 不再依赖继承根 `tsconfig` 的源码 alias 生成声明
- `pnpm nx build ai`
- `pnpm nx build api`
- `pnpm nx build desktop`

## 约束

- 不允许业务代码直接导入其他包的 `src` 真实路径
- 不引入源码 alias 与运行时 alias 两套 import 写法
- 不把所有库强行收敛到同一构建器细节，只统一边界规则
