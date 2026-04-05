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

## 🧭 长期目标与范式

### 长期目标

项目的长期目标不是“把异常映射得更聪明”，而是：

- **在可预期的失败路径上，优先显式返回 `Result.fail(...)`**
- **不要依赖 `throw new Error(...)` 再由适配器、中间件或客户端去猜测错误语义**

这条原则适用于：

- Application Use Case
- Controller / Transport Handler
- HTTP / IPC Client Adapter
- 跨模块调用边界

### 推荐范式

```typescript
// ✅ 推荐：可预期失败显式返回 Result.fail
async function getById(id: string): AsyncResult<User> {
  const user = await repo.findById(id);
  if (!user) {
    return ResultErrors.notFound(`User not found: ${id}`);
  }
  return ok(user);
}
```

```typescript
// ❌ 不推荐：先 throw，再依赖边界层猜测语义
async function getById(id: string): Promise<User> {
  const user = await repo.findById(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
}
```

### 为什么这是更优雅、更根本的方式

`Result.fail(...)` 比 `throw new Error(...)` 更适合作为项目的主范式，因为它：

1. **语义显式**：错误码、消息、details、context 在创建点就明确，不需要后续猜测
2. **跨边界稳定**：HTTP、IPC、客户端、测试都能稳定拿到同一份失败语义
3. **避免错误丢失**：不会在 adapter / middleware / client 中被压成笼统的 `INTERNAL_ERROR`
4. **更易测试**：测试可以直接断言 `result.error.code`，不必依赖异常链
5. **更易演进**：调用方在类型层面就知道这里存在失败分支

### `throw` 的保留使用场景

这不意味着项目里完全禁止 `throw`。`throw` 应保留给以下情况：

- 真正的编程错误或不变量破坏
- 启动期配置错误
- 第三方库直接抛出的异常
- 当前遗留代码尚未迁移到 Result Pattern
- 极底层值对象 / 聚合内部的强约束校验

但在 **跨层、跨模块、跨进程、跨网络** 的边界上，长期目标仍然是：

- **把可预期失败收敛为显式 `Result.fail(...)`**
- **把 `throw` 限制在真正异常的场景**

### DomainError 的定位

`DomainError` 仍然是合法工具，但它更适合作为：

- 领域内部强约束的表达方式
- 旧代码与新范式之间的兼容桥梁
- adapter / middleware 识别结构化异常的兜底支持

长期来看，项目希望减少“依赖抛出 `DomainError` 再在边界层转换”的比例，
优先采用：

- **在应用层或传输层直接返回 `Result.fail(...)`**

也就是说：

- `DomainError` 是可兼容的
- `Result.fail(...)` 才是主范式

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

### Phase 1.5: 减少“throw + 边界转换”的路径

从现在开始，新增代码默认遵循：

- 业务可预期失败：`return fail(...)`
- 参数/校验失败：`return fail({ code: 'VALIDATION_ERROR', ... })`
- 权限失败：`return fail({ code: 'FORBIDDEN' | 'UNAUTHORIZED', ... })`
- 冲突/不存在：`return fail({ code: 'CONFLICT' | 'NOT_FOUND', ... })`

不要默认写成：

- `throw new Error(...)`
- `throw new DomainError(...)` 然后等待边界层转换

边界层的异常转换能力应该被视为：

- **兼容机制**
- **遗留代码兜底**

而不是新代码的首选表达方式。

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

项目在错误处理上的长期方向也应明确为：

- **新代码优先显式返回 `Result.fail(...)`**
- **尽量不要依赖 `throw` 再由边界层做语义恢复**
- **让错误语义在创建点就完整且稳定**
