# API 响应格式规范

> 所有 API 响应必须统一使用 `ok` 字段表示操作成功状态

## ✅ 正确示例

```typescript
// 基础响应
interface BaseResponse<T> {
  ok: boolean;
  data?: T;
  error?: ErrorInfo;
}

// 操作结果
interface ActionResult {
  ok: boolean;
  message?: string;
}
```

## ❌ 错误示例

```typescript
// 禁止使用
interface BadResponse {
  success: boolean;  // ❌ 不允许
  data?: unknown;
}
```

## 📦 标准类型

使用 `@dailyuse/contracts` 中预定义的类型：

```typescript
import type { 
  ActionResult,
  CountResult,
  BatchActionResult,
  ActionWithDataResult
} from '@dailyuse/contracts/result/action';

import type {
  Result,
  IpcResult,
  HttpResponse
} from '@dailyuse/contracts';
```

## 🎯 使用场景

| 场景 | 使用类型 |
|------|---------|
| 简单操作（增删改） | `ActionResult` |
| 返回数据的操作 | `ActionWithDataResult<T>` |
| 批量操作 | `BatchActionResult` |
| 计数操作 | `CountResult` |
| HTTP API 响应 | `HttpResponse<T>` |
| IPC 通信 | `IpcResult<T>` |

## 🔧 迁移指南

将 `success` 改为 `ok`：

```typescript
// Before
return { success: true, data: result };

// After
return { ok: true, data: result };
```
