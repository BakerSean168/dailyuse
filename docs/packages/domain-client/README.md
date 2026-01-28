---
created: 2026-01-28T19:05:54
updated: 2026-01-28T19:11:10
tags: [packages/domain-client]
---

Domain Client (客户端)

domain-client 包是各个模块在客户端中的领域层的代码实现。主要是 聚合根对象 和 实体对象。

客户端的 领域对象 应该是一个 **“富数据的视图模型 (Rich Data Model)”**：
- **展示数据**，辅助UI逻辑，收集用户输入。
- 数据来源于 API (ClientDTO)
- **本地乐观更新** (Optimistic UI) 或 **只读**。
- 依赖 Contracts, UI State Lib (可选)。
- **反序列化**：通常只有 `fromClientDTO`，很少有 `create`。