# 统一 API 响应格式设计

## ✅ 已完成实施

### 变更摘要

Auth 模块已完成统一响应格式改进：

| 文件 | 变更 |
|------|------|
| `AuthDesktopApplicationService.ts` | 所有核心方法改为返回 `IpcResult<T>` |
| `auth-ipc-handler.ts` | 移除 `handleRequest` 包装，直接返回服务结果 |
| `RegisterView.tsx` | 简化为使用 `result.ok` 检查 |
| `LoginView.tsx` | 简化为使用 `result.ok` 检查 |
| `auth.ipc-handlers.ts` | 添加了 `enterOfflineMode` handler |

### 新的统一格式

1. **单一 Result 语义**：所有层都使用 `ok/fail` 语义，不嵌套
2. **传输格式适配**：不同传输通道使用对应的序列化格式
3. **业务数据直传**：成功时 `data` 直接是业务数据，失败时 `error` 直接是错误

### 三种传输格式

```typescript
// 1. 内部 Result（业务逻辑层）
type Result<T> = 
  | { ok: true; data: T; meta?: ResultMeta }
  | { ok: false; error: ResultError; meta?: ResultMeta };

// 2. IPC 传输格式（Desktop 主进程 ↔ 渲染进程）
interface IpcResult<T> {
  ok: boolean;
  data?: T;           // 成功时：业务数据
  error?: { code: string; message: string; details?: [] };
  meta?: { traceId?; duration?; timestamp? };
}

// 3. HTTP 传输格式（所有 HTTP 通信）
interface HttpResponse<T> {
  success: boolean;   // 对应 ok
  code: number;       // HTTP 状态码
  message: string;
  data?: T;           // 成功时：业务数据
  error?: { code; message; details? };
  timestamp: number;
  traceId?: string;
}
```

### 数据流转图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ✅ 统一后的格式流转                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │ API 服务器   │                                                           │
│  │ (业务逻辑)   │ ──→ Result<User> { ok: true, data: { uuid, name } }      │
│  └──────────────┘                                                           │
│         │                                                                   │
│         ▼ toHttpResponse()                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ HttpResponse { success: true, code: 200, data: { uuid, name } }      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         │ HTTP                                                              │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │ Desktop 主进程   │ ←── fromHttpResponse() ──→ Result<User>              │
│  │ (作为HTTP客户端) │                                                       │
│  └──────────────────┘                                                       │
│         │                                                                   │
│         │ 业务处理后                                                        │
│         ▼ toIpcResult(ok(userData))                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ IpcResult { ok: true, data: { uuid, name } }  ← 直接是业务数据！      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         │ IPC                                                               │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │ Desktop 渲染进程 │ ←── 直接使用 result.ok 和 result.data                │
│  │ (React 组件)     │     无需再检查 result.data.success！                  │
│  └──────────────────┘                                                       │
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │ Web 端          │ ←── fromHttpResponse() 或直接使用 response.success    │
│  │ (React 组件)     │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 实施改进

### 1. 废弃 AuthOperationResult

```typescript
// ❌ 旧方式（废弃）
interface AuthOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// IPC Handler 返回嵌套结构
async register(request): Promise<AuthOperationResult> {
  return { success: true, data: { accountUuid } };
}
// handleRequest 再包一层 → { ok: true, data: { success: true, data: {...} } }

// ✅ 新方式
// Application Service 直接返回业务数据或抛出 ServiceError
async register(request): Promise<{ accountUuid: string; sessionUuid: string }> {
  // 成功：直接返回数据
  return { accountUuid, sessionUuid };
  
  // 失败：抛出 ServiceError（由 handleRequest 捕获并转换）
  throw new ServiceError('EMAIL_EXISTS', '邮箱已被注册', 409);
}
// handleRequest 包装 → { ok: true, data: { accountUuid, sessionUuid } }
```

### 2. Desktop 主进程作为 HTTP 客户端

Desktop 主进程调用 API 时，需要创建一个 HTTP 客户端适配层：

```typescript
// packages/infrastructure-client/src/http/api-client.ts

import { fromHttpResponse, type Result } from '@dailyuse/contracts/result';

/**
 * Desktop HTTP API 客户端
 * 将 HttpResponse 转换为内部 Result
 */
export class DesktopApiClient {
  constructor(private baseUrl: string) {}

  async request<T>(path: string, options?: RequestInit): Promise<Result<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, options);
    const httpResponse = await response.json();
    
    // 将 HttpResponse 转换为 Result
    return fromHttpResponse<T>(httpResponse);
  }

  async post<T>(path: string, data: unknown): Promise<Result<T>> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
}
```

### 3. 渲染进程统一调用方式

```typescript
// 使用 createIpcClientWrapper
const ipcClient = createIpcClientWrapper(window.electronAPI);

// 调用方式统一
const result = await ipcClient.invoke<UserData>('auth:login', credentials);

if (result.ok) {
  // result.data 直接是 UserData，无需再解包
  console.log(result.data.accountUuid);
} else {
  // result.error 直接是错误信息
  setError(result.error.message);
}
```

## 📝 迁移检查清单

### Phase 1: 废弃 AuthOperationResult

- [ ] 修改 `AuthDesktopApplicationService` 方法签名
  - `login()` 返回 `Promise<LoginData>` 而非 `Promise<AuthOperationResult>`
  - `register()` 返回 `Promise<RegisterData>`
  - `enterOfflineMode()` 返回 `Promise<OfflineModeData>`
  - 失败时抛出 `ServiceError`
  
- [ ] 更新 `BaseIPCHandler.handleRequest` 注释，说明期望的返回格式

- [ ] 更新渲染进程代码，直接使用 `result.ok` 和 `result.data`

### Phase 2: 统一 HTTP 客户端

- [ ] 创建 `DesktopApiClient` 类
- [ ] 修改 `AuthDesktopApplicationService.register` 使用新客户端
- [ ] 添加响应格式转换工具

### Phase 3: Web 端对齐

- [ ] 确保 API 返回 `HttpResponse` 格式
- [ ] Web 端使用 `fromHttpResponse` 或直接使用 `response.success`

## 🎯 最终效果

```typescript
// Desktop 渲染进程 - 统一的调用方式
const result = await window.electronAPI.invoke('auth:register', { email, password });

if (result.ok) {
  // ✅ data 直接是业务数据
  console.log('注册成功', result.data.accountUuid);
  navigate('/main');
} else {
  // ✅ error.message 直接是错误消息
  setError(result.error.message);
}

// Web 端 - 类似的调用方式
const response = await api.post('/auth/register', { email, password });

if (response.success) {
  console.log('注册成功', response.data.accountUuid);
} else {
  setError(response.error.message);
}
```
