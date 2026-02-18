---
created: 2026-01-28T19:05:54
updated: 2026-02-18T12:00:00
tags: [packages/domain-client]
---

Domain Client (客户端)

> ⚠️ Legacy Note: `domain-client` 集中包已下线，当前采用「按业务域垂直切分包」架构。
> 客户端领域逻辑请放在 `apps/{web,desktop}/src/modules/{domain}` 或 `packages/{domain}` 中，
> 共享值对象与基础类型放在 `packages/domain-shared`。

以下内容仅作为历史设计参考：

domain-client 包曾用于各模块在客户端的领域层代码实现，主要包含聚合根对象和实体对象。

客户端的 领域对象 应该是一个 **“富数据的视图模型 (Rich Data Model)”**：
- **展示数据**，辅助UI逻辑，收集用户输入。
- 数据来源于 API (ClientDTO)
- **本地乐观更新** (Optimistic UI) 或 **只读**。
- 依赖 Contracts, UI State Lib (可选)。
- **反序列化**：通常只有 `fromClientDTO`，很少有 `create`。