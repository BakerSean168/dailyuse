# 错误处理规范

> 统一的错误处理使调试和用户体验更好

## 🏗️ 错误类型

```typescript
// 基础错误类
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// 具体错误
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
```

## 📋 错误码规范

| 前缀 | 领域 | 示例 |
|------|------|------|
| AUTH_ | 认证 | AUTH_TOKEN_EXPIRED |
| TASK_ | 任务 | TASK_NOT_FOUND |
| SYNC_ | 同步 | SYNC_CONFLICT |
| DB_ | 数据库 | DB_CONNECTION_FAILED |

## ✅ 正确处理

```typescript
// Service 层 - 抛出具体错误
async function getTask(id: string): Promise<Task> {
  const task = await repo.findById(id);
  if (!task) {
    throw new NotFoundError('Task');
  }
  return task;
}

// Controller 层 - 统一捕获
async function handleGetTask(req: Request): Promise<Response> {
  try {
    const task = await getTask(req.params.id);
    return { ok: true, data: task };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    throw error;  // 未知错误继续抛出
  }
}
```

## 🔧 异步错误

```typescript
// ✅ Promise 错误处理
const result = await someAsyncOp().catch(handleError);

// ✅ 使用 Result 模式
async function safeGetTask(id: string): Promise<Result<Task>> {
  try {
    const task = await getTask(id);
    return { ok: true, data: task };
  } catch (error) {
    return { ok: false, error: toErrorInfo(error) };
  }
}
```

## 🚫 避免的做法

```typescript
// ❌ 吞掉错误
try {
  await riskyOp();
} catch (e) {
  // 什么都不做
}

// ❌ 泛泛的错误信息
throw new Error('Error');  // 不具体

// ❌ 抛出字符串
throw 'Something went wrong';  // 用 Error 对象
```
