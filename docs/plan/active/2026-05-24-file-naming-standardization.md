---
tags:
  - plan
  - governance
  - refactor
description: 文件命名规范重设与首轮命名统一执行方案
created: 2026-05-24T00:00:00
updated: 2026-05-24T00:00:00
---

# 文件命名规范重设与首轮统一方案

## 摘要

本计划用于替换当前 ADR-011 中“所有文件统一 kebab-case”的过宽规则，并在仓库一方源码范围内完成首轮命名统一。

执行分支固定为 `refactor/file-naming-standardization`，从 `main` 切出。

## 最终规范

- 目录：`kebab-case`
- 普通 TS/JS 模块：`kebab-case`
- UI 组件、View、Screen、Dialog、Card、Widget、Page Object：`PascalCase`
- Hook / Composable：`camelCase`，且 `use*` 文件名与主导导出保持一致
- 框架保留文件：按框架要求保留，例如 Expo Router 的 `_layout.tsx`、`[id].tsx`
- Python：`snake_case`
- 生成物、第三方输出、归档文档、论文资产、截图等不纳入本轮规范治理

## 变更内容

### 1. 规范真值更新

- 更新 `docs/architecture/adr/ADR-011-standard-naming-conventions.md`
- 去掉“所有文件都用 kebab-case”的统一要求
- 将命名规则改为按文件职责分层
- 只在必要处补一条轻量引用，不复制整套规则到多个文档

### 2. 治理自动化

- 新增 `tools/governance/file-naming-audit.mjs`
- 审计范围限定为 `apps/**` 与 `packages/**`
- 接入根 `project.json` 的 `daily-use:governance-check`
- 排除：
  - `node_modules`、`dist`、`coverage`、`.nx`
  - generated / vendored 路径
  - 文档与资产目录
  - 框架保留文件名

### 3. 首轮重命名执行

- 不对已经符合新规范的 Vue 组件文件做无意义重命名
- 将 React hooks 与 Vue composables 收敛到 `camelCase`
- 将类/服务/错误/值对象主导的普通 TS 模块收敛到 `kebab-case`
- 同步修复所有 import、barrel export、story/spec 引用与注册点
- Windows 下对仅大小写变化的路径使用中间名两步重命名

## 执行顺序

1. 写入计划并更新 ADR-011
2. 添加文件命名审计脚本并接入 `governance-check`
3. 先跑审计，拿到新标准下的真实违规清单
4. 分批重命名：
   - hooks / composables
   - 普通 TS 模块
   - 受影响的共享引用与 barrel
5. 运行治理检查与最近的 lint / typecheck

## 验收标准

- ADR-011 与治理脚本表达同一套规则
- `pnpm nx run daily-use:governance-check` 能拦截真实违规并放过设计内例外
- 所有重命名后的 import 路径可正常解析
- Vue 组件区不发生无意义 churn
- hooks / composables 与普通 TS 模块不再混用多种命名哲学
