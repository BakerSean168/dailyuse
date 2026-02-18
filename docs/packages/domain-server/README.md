---
created: 2026-01-28T19:08:46
updated: 2026-02-18T12:00:00
tags: [packages/domain-server]
---

Domain Server (服务端)

> ⚠️ Legacy Note: `domain-server` 集中包已下线，当前采用「按业务域垂直切分包」架构。
> 服务端领域逻辑请放在 `packages/{domain}` 包内（按 domain/application/infrastructure 分层）。
> 共享值对象与基础类型放在 `packages/domain-shared`。

以下内容仅作为历史设计参考：

domain-server 包曾用于各模块在服务端的领域层代码实现，主要包含聚合根对象、实体对象、仓储接口、领域服务。

服务端的 领域对象 应该是一个“全功能领域模型”：
- **保护不变量**，执行业务规则，生成事件，持久化。
- 数据来源于 数据库 (PersistenceDTO)
- **修改内部状态** + 发事件 + 落库。
- 依赖 Infrastructure, Contracts。
- **工厂**：生成初始状态（默认头像、默认设置）。