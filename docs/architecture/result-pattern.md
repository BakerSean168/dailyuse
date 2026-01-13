# Result Pattern - 统一的操作结果类型系统

## 🎯 设计目标

解决当前项目中存在的**三套不同响应格式**问题：

| 位置 | 格式 | 问题 |
|------|------|------|
| `contracts/response` | `{ code, success, message, data, timestamp }` | HTTP API 专用 |
| `utils/response` | 同上，ResponseBuilder 实现 | 与 contracts 重复 |
| `base-ipc-handler.ts` | `{ success, data?, error?, meta? }` | IPC 专用，与 HTTP 不统一 |

## 🌟 Result Pattern 优势

### 1. Protocol Agnostic（协议无关）

```typescript
// 同一个 Result 可用于任何传输协议
const result: Result<User> = await userService.getById(id);

// HTTP API
res.status(getHttpStatus(result)).json(result);

// IPC
return toIpcResult(result);

// WebSocket
socket.emit('response', result);
```

### 2. Type Safe（类型安全）

```typescript
const result = await userService.getById(id);

// TypeScript 强制检查 ok 状态
if (isOk(result)) {
  // result.data 类型为 User
  console.log(result.data.name);
} else {
  // result.error 类型为 ResultError
  console.error(result.error.message);
}
```

### 3. Composable（可组合）

```typescript
// 链式处理
const result = await tryCatch(() => fetchUser(id))
  .then(r => map(r, user => user.profile))
  .then(r => flatMap(r, profile => validateProfile(profile)));
```

### 4. 借鉴业界最佳实践

- **Rust** `Result<T, E>`
- **fp-ts** `Either<E, A>`
- **tRPC** procedure returns
- **Zod** safe parse

## 📦 使用方式

### 基础使用

```typescript
import { ok, fail, isOk, ResultErrors } from '@dailyuse/contracts/result';

// 创建成功结果
const success = ok({ id: '123', name: 'Test' });

// 创建失败结果
const failure = ResultErrors.notFound('User not found');

// 检查结果
if (isOk(result)) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

### IPC 通信

**Main Process:**
```typescript
import { ok, fail, toIpcResult, createIpcHandler } from '@dailyuse/contracts/result';

// 方式1: 手动转换
ipcMain.handle('user:get', async (_, id) => {
  const user = await db.users.findById(id);
  if (!user) {
    return toIpcResult(ResultErrors.notFound('User not found'));
  }
  return toIpcResult(ok(user));
});

// 方式2: 使用 handler 包装器（推荐）
const getUserHandler = createIpcHandler(async (id: string) => {
  const user = await db.users.findById(id);
  if (!user) {
    return ResultErrors.notFound('User not found');
  }
  return ok(user);
});

ipcMain.handle('user:get', (_, id) => getUserHandler(id));
```

**Renderer Process:**
```typescript
import { fromIpcResult, isOk, createIpcClientWrapper } from '@dailyuse/contracts/result';

// 方式1: 手动转换
const ipcResult = await ipcRenderer.invoke('user:get', id);
const result = fromIpcResult<User>(ipcResult);

if (isOk(result)) {
  setUser(result.data);
}

// 方式2: 使用客户端包装器（推荐）
const ipcClient = createIpcClientWrapper(ipcRenderer);
const result = await ipcClient.invoke<User>('user:get', id);
```

### HTTP API

```typescript
import { ok, getHttpStatus, isOk, ResultErrors } from '@dailyuse/contracts/result';

// Controller
async function getUser(req: Request, res: Response) {
  const result = await userService.getById(req.params.id);
  res.status(getHttpStatus(result)).json(result);
}

// Service
async function getById(id: string): AsyncResult<User> {
  const user = await db.users.findById(id);
  if (!user) {
    return ResultErrors.notFound('User not found');
  }
  return ok(user);
}
```

## 🔄 迁移策略

### Phase 1: 新代码使用 Result Pattern

所有新的 Service 方法返回 `Result<T>`：

```typescript
// Before
async getById(id: string): Promise<User | null> {
  return db.users.findById(id);
}

// After
async getById(id: string): AsyncResult<User> {
  const user = await db.users.findById(id);
  if (!user) {
    return ResultErrors.notFound('User not found');
  }
  return ok(user);
}
```

### Phase 2: 更新 IPC Handler

使用 `createIpcHandler` 包装现有逻辑：

```typescript
// Before
ipcMain.handle('user:get', async (_, id) => {
  return this.handleRequest('user:get', () => userService.getById(id));
});

// After
const getUserHandler = createIpcHandler(userService.getById.bind(userService));
ipcMain.handle('user:get', (_, id) => getUserHandler(id));
```

### Phase 3: 更新 IPC Adapter

使用 `createIpcClientWrapper`：

```typescript
// Before
async getUser(id: string): Promise<User> {
  return ipcRenderer.invoke('user:get', id);
}

// After
private ipcClient = createIpcClientWrapper(ipcRenderer);

async getUser(id: string): AsyncResult<User> {
  return this.ipcClient.invoke<User>('user:get', id);
}
```

## 📁 文件结构

```
packages/contracts/src/
├── result/
│   ├── index.ts        # 核心 Result 类型和工具
│   └── ipc.ts          # IPC 适配器
├── response/           # 旧的 HTTP Response 类型（保留兼容）
└── index.ts            # 导出入口
```

## 🎨 子路径导入

```typescript
// 推荐：从子路径导入
import { ok, fail, isOk, Result } from '@dailyuse/contracts/result';

// 或从根入口导入（也支持）
import { ok, fail, isOk, Result } from '@dailyuse/contracts';
```

## 🔗 与现有 Response 系统的关系

- `@dailyuse/contracts/response` - **保留**，用于 HTTP API 的详细响应格式
- `@dailyuse/contracts/result` - **新增**，Protocol Agnostic 的通用结果类型

两者可以共存，逐步迁移。

## ✅ 总结

Result Pattern 提供了：

1. **统一的数据格式** - HTTP/IPC/WebSocket 共用
2. **类型安全** - 强制检查成功/失败状态
3. **函数式组合** - map/flatMap/tryCatch
4. **错误工厂** - 便捷的常用错误创建
5. **渐进式迁移** - 与现有代码兼容
