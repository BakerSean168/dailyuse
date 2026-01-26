---
created: 2026-01-26T12:50:04
updated: 2026-01-26T12:50:28
tags:
  - type
  - module/authentication
---

## Overview

这是一个示例状态类型，展示了如何在 DDD 中定义和使用枚举类型来表示实体或聚合根的状态。

## 定义

```typescript

export type ExpampleStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

```