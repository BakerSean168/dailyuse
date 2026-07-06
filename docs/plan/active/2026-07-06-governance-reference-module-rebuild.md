---
tags:
  - plan
  - active
  - governance
  - architecture
description: 将 governance 收敛为仓库级严格参考模块，消除层名泄漏、客户端浅 seam、UI 领域漂移与 mocks 特例
created: 2026-07-06T00:00:00+08:00
updated: 2026-07-06T00:00:00+08:00
---

# Governance Reference Module Rebuild

## 目标

把 `packages/governance` 从“仍暴露旧分层痕迹的活文档模块”重构为“仓库严格参考实现”：

- 公共契约唯一真值源固定为 `@dailyuse/contracts/governance`
- 运行时根入口只承担服务端组合根职责
- 客户端只暴露一个深的 `client` seam，不再暴露 `application-client` / `infrastructure-client`
- Electron 入口改为语义化 `electron` seam，不再暴露 `electron-entry`
- UI 展示逻辑从 governance 包内 `domain-client` 移回 app 层
- mocks 收敛到 `@dailyuse/contracts/mocks`

## 最终公开结构

```text
@dailyuse/contracts/governance  # 公共契约
@dailyuse/contracts/mocks       # governance mock 也在这里

@dailyuse/governance            # 服务端组合根
@dailyuse/governance/api        # HTTP API 模块
@dailyuse/governance/client     # Web / Desktop renderer 客户端 seam
@dailyuse/governance/electron   # Desktop main 入口
```

## 必删的旧公开 seam

- `@dailyuse/governance/domain-shared`
- `@dailyuse/governance/domain-server`
- `@dailyuse/governance/domain-client`
- `@dailyuse/governance/application-client`
- `@dailyuse/governance/infrastructure-client`
- `@dailyuse/governance/electron-entry`
- `@dailyuse/governance/mocks`

## 重构原则

1. 不保留兼容导出
2. 不保留双轨契约
3. 不把 UI 展示模型继续伪装成 domain seam
4. 不把 transport adapter seam 继续公开成 feature API
5. governance 的公开结构必须比仓库其他模块更严格、更少层、更低认知负担

## 实施步骤

1. 建立新的 `client` / `electron` 公开 seam，并更新 `package.json` / `tsup`。
2. 让 `client` 直接成为治理客户端的唯一公开 interface，不再暴露 `GovernanceClientService`、`IRuleApiClient`、`RuleHttpAdapter`、`RuleIpcAdapter`。
3. 迁移 Web、Desktop renderer、Desktop preload tests 到新的 `@dailyuse/governance/client`。
4. 移除 app-vue 对 `@dailyuse/governance/domain-client` 的依赖，把展示派生和 hydration 迁到 `packages/app-vue/src/modules/governance/`。
5. 把 governance mocks 迁到 `packages/contracts/src/mocks/`，删除 governance 的 mock 子路径。
6. 删除 governance 包旧公开子路径和对应目录或入口。
7. 更新 README、治理速查、模块索引、导出审计规则，确保活文档与真实代码一致。
8. 运行最小验证，至少覆盖 `contracts`、`governance`、desktop/web 调用方与 `daily-use:governance-check`。

## 完成标准

- `packages/governance/package.json` 只保留 `.`, `./api`, `./client`, `./electron`
- app/web、desktop renderer、desktop main、preload tests 不再引用 governance 的旧层名子路径
- `packages/app-vue` 不再引用 `@dailyuse/governance/domain-client`
- governance mocks 只从 `@dailyuse/contracts/mocks` 导入
- README / quick reference / audit 反映新的真实结构
- `daily-use:governance-check` 通过
