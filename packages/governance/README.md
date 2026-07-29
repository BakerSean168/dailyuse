# @memoflow/governance

治理模块（活文档）— 当前仓库的参考模块。它展示的是目标架构，而不是历史兼容结构：公共 contracts 集中、public seam 收敛、服务端内部统一为 `server/*` 切片。

## 公开 seam

```text
@memoflow/contracts/governance
@memoflow/contracts/mocks

@memoflow/governance
@memoflow/governance/api
@memoflow/governance/client
@memoflow/governance/electron
```

## 模块职责

- `@memoflow/contracts/governance`：治理公共契约唯一真值源
- `@memoflow/governance`：规范化服务端组合根
- `@memoflow/governance/api`：HTTP API 模块
- `@memoflow/governance/client`：Web / Desktop renderer 客户端 seam
- `@memoflow/governance/electron`：Desktop main 入口

## 内部结构标准

```text
packages/governance/src/
├── api/                    # HTTP module 与 resource-first routes
├── client/                 # renderer client seam
├── electron/               # desktop main seam
├── server/
│   ├── domain/             # 聚合根、实体、仓储接口、值对象
│   ├── application/        # commands / queries / GovernanceApplicationPort
│   ├── transport/          # controller 与 transport 翻译
│   └── infrastructure/     # adapters / runtime / composition root / seed
└── index.ts                # canonical server composition root public entry
```

## 明确不再保留的公开层

- `@memoflow/governance/domain-shared`
- `@memoflow/governance/domain-server`
- `@memoflow/governance/domain-client`
- `@memoflow/governance/application-client`
- `@memoflow/governance/infrastructure-client`
- `@memoflow/governance/electron-entry`
- `@memoflow/governance/mocks`

## 关键收敛点

- 公共契约只保留在 `packages/contracts`
- former `domain-shared` + `domain-server` 合并为 `server/domain`
- former `controllers` 收敛为 `server/transport`
- 模块运行时副作用归位到 `server/infrastructure/runtime`
- root 只暴露 `createGovernanceModule()`，不暴露技术命名工厂
- governance IPC channel / payload 统一收口到 `@memoflow/contracts/governance/protocol`
- UI display logic 不放在治理包内，app 层自行派生展示模型

## 活文档定位

> `governance` 的代码结构本身就是仓库治理标准。
>
> 新模块开发时，应优先对齐这套 `api/client/electron/server/*` 结构，而不是继续复制旧的 layer-named seam、模块内公共 contracts 或 UI domain-client 特例。