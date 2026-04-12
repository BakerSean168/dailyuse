# DailyUse 项目 Axios 使用与技术解析指南

本指南旨在整理 **DailyUse** 项目中 Axios 的架构设计、核心实现及其背后的核心知识点，帮助开发者快速上手并深入理解企业级 HTTP 请求库的封装实践。

---

## 1. 项目架构概览

在 DailyUse 项目中，Axios 的封装被集中在 `@dailyuse/http-client` 包中。这种设计实现了「一次编写，到处运行」的原则，确保了核心逻辑（如 Token 注入、刷新、错误映射）在 Web、Desktop 或其他客户端平台上保持高度一致。

### 📦 核心包结构
- **`packages/http-client`**: 核心逻辑库。
  - [`axios-instance.ts`](../packages/http-client/src/axios-instance.ts): 基础工厂函数，负责创建 Axios 实例及请求侧拦截。
  - [`axios-http-client.ts`](../packages/http-client/src/axios-http-client.ts): 面向 DI（依赖注入）设计的传统客户端，返回 `Promise<T>`。
  - [`result-http-client.ts`](../packages/http-client/src/result-http-client.ts): 封装了 **Result 模式** 的客户端，返回 `Promise<Result<T>>`。
  - `src/types.ts`: 类型定义与接口契约。

---

## 2. 核心知识点与项目实现

### 🔹 2.1 Axios 实例工厂 (Axios Instance)
**知识点**：通过 `axios.create()` 创建独立实例，可以避免污染全局 Axios 配置，并能根据不同业务场景定制 `baseURL`、`timeout`。

**项目实现**：
```typescript
const instance = axios.create({
  baseURL,
  timeout,
  headers: { 'Content-Type': 'application/json' },
  ...axiosConfig, // 允许透传额外配置
});
```

### 🔹 2.2 请求拦截器：Token 注入 (Request Interceptors)
**知识点**：在请求发送前统一处理逻辑，最常见的场景是注入身份令牌（Bearer Token）。

**项目实现**：
项目使用了一个 `TokenProvider` 接口来延迟获取 Token，确保在 Token 变化时（如登录成功后），拦截器总是能拿到最新的值。
```typescript
instance.interceptors.request.use((requestConfig) => {
  if (tokenProvider) {
    const token = tokenProvider.getAccessToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`; // 统一注入
    }
  }
  return requestConfig;
});
```

### 🔹 2.3 响应拦截器：数据剥离与错误映射 (Response Interceptors)
**知识点**：后端返回的数据通常带有「业务信封」（如 `{ ok: true, data: ..., error: ... }`）。通过响应拦截器，我们可以直接剥离信封，让业务层只处理纯数据内容。

**项目实现**：
1. **成功处理**：检查 `data.ok`，若为 `true` 则返回 `data.data`。
2. **错误处理**：将 HTTP 状态码（404, 500 等）和后端自定义错误码转换为统一的 `HttpClientError` 对象。

---

## 3. 进阶核心：401 并发刷新 Token

这是 Axios 封装中最具挑战性也最面试高频的知识点。

### 🚨 痛点：
当 Access Token 过期时，API 返回 401。此时如果页面上同时发出了 5 个请求，这 5 个请求都会收到 401。

### ✅ DailyUse 的解决方案 (队列模式)：
1. **并发加锁**：第一个 401 请求进入时，将 `isRefreshing` 标记为 `true`，并调用 `onTokenRefresh`。
2. **请求排队**：后续接到的 401 请求不立即抛错，而是存入一个 `refreshQueue`。
3. **刷新重试**：当 Token 刷新成功后，遍历 `refreshQueue`，用新 Token 修改请求头，并重新执行这些请求。

**核心代码实现逻辑**：
```typescript
private async handleTokenRefresh(originalConfig) {
  if (this.isRefreshing) {
    // 1. 已在刷新中 → 排队等待 Promise
    return new Promise((resolve, reject) => {
      this.refreshQueue.push({ resolve, reject });
    }).then((newToken) => {
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      return this.axios.request(originalConfig); // 使用新 Token 重试原请求
    });
  }

  this.isRefreshing = true;
  try {
    const newToken = await this.onTokenRefresh!(); // 2. 调用外部（Pinia）刷新逻辑
    // 3. 成功后遍历队列通知解冻 ...
    return this.axios.request(originalConfig);
  } finally {
    this.isRefreshing = false;
  }
}
```

---

## 4. 设计模式：Result 模式 vs 传统报错

项目提供了两种客户端选择，适应不同的开发风格：

| 方案 | 所在类 | 业务层写法 | 优点 |
| :--- | :--- | :--- | :--- |
| **传统模式** | `AxiosHttpClient` | `try { await api() } catch(e) {}` | 符合大部分人的习惯，适用于简单的命令式逻辑。 |
| **Result 模式** | `ResultHttpClient` | `const res = await api(); if(res.ok) { ... }` | **项目推荐**。通过返回对象而非抛错，利用 TS 类型守卫实现强制错误处理。 |

**Result 模式优势示例**：
```typescript
const result = await resultHttpClient.get<User>('/profile');

if (result.ok) {
  // TS 自动推断 result.data 的类型为 User
  userProfile.value = result.data;
} else {
  // 无论是 401、500 还是网络异常都走这里，IDE 会提示 result.error 是可选的
  notify(result.error.message);
}
```

---

## 5. Web 应用中的深度集成

在 `apps/web` 中，我们将 `ResultHttpClient` 与 **Pinia** 状态管理器紧密结合。

**集成要点**：
1. **Token 延迟读取**：通过回调函数在请求瞬间从 `authenticationStore` 获取 Token（解决循环依赖）。
2. **刷新闭环**：
   - 刷新时使用原生的 `fetch` 而非自身的 `httpClient`，**防止递归死循环**。
   - 刷新成功后使用 `store.$patch` 同步更新本地状态。
3. **降级处理**：如果刷新依然失败（Refresh Token 也过期），则调用 `onUnauthorized` 清空 Store 并跳转至登录页。

---

## 💡 开发最佳实践

1. **统一出口**：不要在业务代码中直接 `import axios`。始终通过 `resultHttpClient` 或 DI 获取实例。
2. **数据类型契约**：充分利用 `@dailyuse/contracts` 中的类型定义，确保前后端字段对齐。
3. **关注性能**：对于不需要 Token 的公开接口（如登录、注册），可以在请求配置中标记跳过拦截逻辑。

---
*文档生成于 2026-04-07 | DailyUse 架构组*
