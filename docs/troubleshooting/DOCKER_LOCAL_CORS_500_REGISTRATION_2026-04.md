# 本地 Docker 注册接口 500 实为 CORS 拒绝问题复盘

## 结论

这次本地 Docker 联调里，`POST /api/v1/auth/register` 从容器内部调用返回 `201 Created`，但从 Windows 浏览器或外部 `curl` 访问时返回 `500 INTERNAL_ERROR`。

真实根因不是：

- Docker 网络异常
- Nginx 代理异常
- 注册业务逻辑异常

真实根因是：

- 浏览器来源是 `http://localhost:8080`
- API 的 `CORS_ORIGIN` 未包含 `http://localhost:8080`
- 我们在 `cors` 的 `origin` 回调里主动执行了 `callback(new Error('Not allowed by CORS'))`
- 我们自己的全局错误处理中间件又把这个普通错误统一改写成了 `500 INTERNAL_ERROR`

因此，前端和外部调用看到的是“服务器内部错误”，而不是更准确的“该来源不被允许访问”。

## 现象

排查期间观测到的现象是：

- 容器内部请求 `http://127.0.0.1:3000/api/v1/auth/register` 返回 `201 Created`
- 外部请求 `http://localhost:3000/api/v1/auth/register` 返回 `500`
- 通过 `http://localhost:8080` 打开前端页面后发起注册，也返回 `500`
- 容器日志里没有出现预期中的业务异常堆栈
- 不带 `Origin` 的 `curl` 可以成功
- 显式带上 `Origin: http://localhost:8080` 的 `curl` 可以稳定复现失败

这组现象说明：

- 业务逻辑本身是通的
- 失败与“是否带 `Origin` 请求头”有关
- 问题发生在路由处理之前的基础设施层，而不是控制器或用例层

## 故障链路

本地 Docker 测试链路如下：

1. 浏览器访问 `http://localhost:8080`
2. `web` 容器中的 Nginx 处理静态站点
3. 前端请求 `/api/v1/auth/register`
4. Nginx 按 [nginx.conf](D:\home\projects\dailyuse\nginx.conf) 把 `/api/` 代理到 `http://api:3000`
5. 浏览器原始 `Origin: http://localhost:8080` 一并到达 API
6. API 在 [global.ts](D:\home\projects\dailyuse\apps\api\src\shared\infrastructure\middleware\global.ts) 的 `cors()` 中间件里校验来源
7. 由于 `http://localhost:8080` 不在 allowlist，我们自己的 `origin` 回调执行 `callback(new Error('Not allowed by CORS'))`
8. Express 进入错误处理中间件
9. API 在 [error.ts](D:\home\projects\dailyuse\apps\api\src\shared\infrastructure\middleware\error.ts) 中把该错误当成普通未知错误处理
10. 响应被改写成 `500 INTERNAL_ERROR`

核心点在于，第 7 步才是真正的失败点，第 10 步只是把真实错误掩盖了。

## CORS 错误是怎么抛出的

错误创建点在 API 全局中间件：

```ts
cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowAllOrigins) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
})
```

这里的行为含义是：

- 没有 `Origin`，直接放行
- `Origin` 在允许列表中，放行
- `Origin` 不在允许列表中，由我们主动创建并上抛错误

所以：

- 容器内部调用成功，是因为那类请求通常没有浏览器 `Origin`
- 外部浏览器调用失败，是因为浏览器一定会带 `Origin`
- 外部 `curl` 默认成功，但手工加上 `Origin` 后也会失败

这也是为什么这次问题看起来像“外部网络不通”，但实际不是网络问题。

## 错误会被自己编写的代码替换吗

会。

而且这次就是被我们自己写的全局错误处理中间件替换掉了。

原始异常是：

```text
Error: Not allowed by CORS
```

但在旧逻辑里，[error.ts](D:\home\projects\dailyuse\apps\api\src\shared\infrastructure\middleware\error.ts) 会把：

- 非 `DomainError`
- 非 Prisma 错误

统一返回成：

```json
{
  "ok": false,
  "code": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```

这意味着：

- CORS 的真实错误语义丢失了
- 客户端只能看到误导性的 500
- 排查方向会被引向“后端业务异常”或“网络问题”

所以答案是明确的：

- CORS 错误不是 `cors` 库自动生成的
- 这个错误是我们在 `origin` 回调里自己构造的
- 最终错误响应是被我们自己的错误处理中间件覆盖掉的
- 原本清晰的错误确实被丢失了

## 为什么日志看起来也不清楚

因为这个错误发生在：

- 路由注册之前
- 控制器之前
- `expressAdapter` 之前

所以你去看注册路由、控制器、用例返回值时，很容易什么都看不到。

这次错误并不是：

- `register` 控制器抛出的
- `expressAdapter` 转换出的
- 业务层 `Result.fail()` 返回的

而是一个更早阶段的基础设施错误。

如果全局错误处理中间件再把它统一改成 500，客户端和调用方就会彻底失去定位信息。

## 本地 Docker 测试场景的直接根因

本地测试使用的是：

- `web` 暴露 `8080:80`
- `api` 暴露 `3000:3000`

即用户实际从：

- `http://localhost:8080`

访问前端。

但 API 进程的 `CORS_ORIGIN` 未包含：

- `http://localhost:8080`
- `http://127.0.0.1:8080`

所以只要请求来自本地 Docker 的前端页面，就会被 CORS 拒绝。

这一点和是否经过 Nginx 无关：

- 经过 `8080 -> Nginx -> api` 会失败
- 直接打 `3000`，只要请求头里有 `Origin: http://localhost:8080`，一样会失败

因此问题本质上是来源配置错误，不是代理错误。

## 这次修复做了什么

### 1. 修正本地 Docker 测试的 CORS 默认值

在 [docker-compose.local-test.yml](D:\home\projects\dailyuse\docker-compose.local-test.yml) 中为 `api` 增加了本地测试专用覆盖：

- `http://localhost:8080`
- `http://127.0.0.1:8080`
- 同时保留 `5173`、`5174`、`3000` 等常见本地调试来源

这样本地 Docker 前端页面默认就能访问 API。

### 2. 修正错误映射，避免把 CORS 误报成 500

在 [error.ts](D:\home\projects\dailyuse\apps\api\src\shared\infrastructure\middleware\error.ts) 中，新增了对 CORS 拒绝的识别逻辑。

当前行为改为：

- CORS 拒绝返回 `403 FORBIDDEN`
- 返回消息保留为 `Not allowed by CORS`
- 其它未知异常仍然保持 `500 INTERNAL_ERROR`

这次修复后，错误语义至少不会再被错误地压平成 500。

### 3. 增加回归测试

新增测试文件：

- [error.spec.ts](D:\home\projects\dailyuse\apps\api\src\shared\infrastructure\middleware\error.spec.ts)

验证两件事：

- `Not allowed by CORS` 会返回 `403 FORBIDDEN`
- 其它普通异常仍返回 `500 INTERNAL_ERROR`

## 这次排查中最关键的验证动作

这几个验证最有价值：

### 1. 容器内直连 API 成功

这一步证明：

- 注册路由是通的
- 控制器和业务逻辑是通的
- 数据库写入能力是正常的

### 2. 外部请求直连 `3000` 仍失败

这一步证明：

- 问题不止是 Nginx
- 失败点更靠近 API 入口本身

### 3. 不带 `Origin` 的 `curl` 成功，带 `Origin` 的失败

这是最关键的一步。

它直接证明：

- 失败不是请求体编码问题
- 失败不是 Host 头问题
- 失败不是 Docker 网络问题
- 失败就是 CORS 校验问题

## 经验总结

### 1. 基础设施错误不要一律压成 500

像 CORS、请求体大小、代理头、认证前置校验这类错误，不应该被统一包装成“内部错误”。

否则会导致：

- 客户端误判
- 监控误判
- 排查路径明显变长

### 2. 浏览器请求和容器内部请求不是同一种请求

浏览器请求天然带有：

- `Origin`
- 预检
- Cookie/凭证语义

容器内 `curl` 或服务间调用没有这些约束。

所以“容器内成功”不能证明“浏览器访问链路没问题”。

### 3. 本地 Docker 联调要把前端访问端口写进 allowlist

只写开发服务器 `5173/5174` 不够。  
如果本地测试页面是从 `8080` 提供的，就必须把 `8080` 也加入 CORS 允许列表。

### 4. 排查跨层问题时，要先找最早失败的层

这次错误发生在：

- 中间件层

而不是：

- 控制器层
- 适配器层
- 业务层

如果一开始就扎进业务代码，会浪费大量时间。

## 一句话结论

这次“本地 Docker 注册接口 500”问题，本质上是一个被全局错误处理中间件掩盖掉的 CORS 拒绝问题。  
原始错误不是 `cors` 库自动抛出的，而是我们在 `origin` 回调里主动创建的；随后它又被通用错误处理逻辑改写成了 `500 INTERNAL_ERROR`，导致真实原因丢失、排查方向偏移。修复后，本地测试来源已加入默认 allowlist，且 CORS 拒绝会明确返回 `403 FORBIDDEN`。
