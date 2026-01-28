---
created: 2026-01-28T19:08:46
updated: 2026-01-28T19:10:24
tags: [packages/domain-server]
---

Domain Server (服务端)

domain-server 包是各个模块在服务端中的领域层的代码实现。主要是 聚合根对象、实体对象、仓储接口、领域服务。

服务端的 领域对象 应该是一个“全功能领域模型”：
- **保护不变量**，执行业务规则，生成事件，持久化。
- 数据来源于 数据库 (PersistenceDTO)
- **修改内部状态** + 发事件 + 落库。
- 依赖 Infrastructure, Contracts。
- **工厂**：生成初始状态（默认头像、默认设置）。