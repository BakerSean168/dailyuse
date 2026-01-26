---
created: 2026-01-26T11:58:58
updated: 2026-01-26T12:00:30
tags:
  - domain/aggregate
  - module/authentication
---

## Overview

example 聚合根是一个样例聚合根，展示了如何在 DDD 中设计和实现一个聚合根。以及文档该怎么写。

## 详细定义

- [[example-status]]

```typescript
export interface ExampleServer {
    uuid: string;
    name: string;
    status: ExampleStatus;
    createdAt: Date;
    updatedAt: Date;
}

```