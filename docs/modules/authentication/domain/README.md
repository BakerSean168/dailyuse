---
created: 2026-01-26T12:03:25
updated: 2026-01-26T12:04:10
tags:
  - domain
  - readme
description: Authentication模块的 domain 层的说明文件。
---
Auth 模块的核心目标只有三个：**验证身份**、**发放通行证（Token）**、**维护通行证的状态**。
基于确定的 **IdP（身份提供商）模式** 以及 **DDD（领域驱动设计）** 架构
## Overview

### 聚合根[[AuthIdentity]]

管理凭证、锁定状态、安全策略
#### 子实体[[AuthCredential]]



AuthSession 聚合根：
管理登录态、刷新令牌、踢人下线