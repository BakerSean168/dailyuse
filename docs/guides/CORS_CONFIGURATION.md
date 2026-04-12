# CORS 配置指南

## 问题症状

当前端请求 API 时收到 `"Not allowed by CORS"` 错误：

```json
{
  "code": "FORBIDDEN",
  "message": "Not allowed by CORS"
}
```

## 根本原因

CORS（跨源资源共享）配置有以下常见问题：

### 1. **通配符 (`*`) 与 Credentials 冲突**（最常见）

当 CORS 配置同时设置以下两项时会发生冲突：

```typescript
cors({
  origin: '*',          // 允许所有来源
  credentials: true,    // 需要发送凭证（Cookie、Authorization）
})
```

**问题**：浏览器 CORS 规范不允许通配符与凭证共存。

### 2. 前端域名未在允许列表中

如果 `CORS_ORIGIN` 环境变量没有包含前端的实际域名。

### 3. 环境变量未正确传递

Docker 部署时 `CORS_ORIGIN` 环境变量没有被正确设置到容器中。

---

## 解决方案

### 方案 A：生产环境（推荐）- 指定具体域名

设置具体的前端域名列表：

```bash
# .env.prod 或 docker-compose.prod.yml
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

此时系统会自动：
- ✅ 启用 `credentials: true`（支持 Cookie 和 Authorization Header）
- ✅ 只允许列表中的域名
- ✅ 预检请求（OPTIONS）会包含正确的响应头

### 方案 B：开发环境 - 允许本地来源

```bash
# .env 或 docker-compose.dev
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080
```

如果使用 `docker-compose.local.yml` 在本地通过 `http://localhost:8080` 访问 Web，
也必须把 `http://localhost:8080` 和 `http://127.0.0.1:8080` 加入允许列表。

### 方案 C：允许所有来源（不推荐）

仅用于开发或内部测试环境：

```bash
CORS_ORIGIN=*
```

此时系统会自动：
- ✅ 允许来自任何来源的请求
- ❌ 禁用 `credentials: true`（Cookie 和 Authorization Header 受限）
- ⚠️ **生产环境不安全**

---

## 配置步骤

### Docker Compose 配置

**docker-compose.prod.yml** 中配置实际的前端域名：

```yaml
services:
  api:
    environment:
      # 根据实际域名修改
      CORS_ORIGIN: ${CORS_ORIGIN:-https://yourdomain.com}
```

### 运行时配置

**方法 1：命令行设置**

```bash
docker-compose -f docker-compose.prod.yml up -d
# 或
CORS_ORIGIN="https://yourdomain.com" docker-compose -f docker-compose.prod.yml up -d
```

**方法 2：.env 文件设置**

```bash
# 项目根目录 .env.prod
CORS_ORIGIN=https://yourdomain.com
```

**方法 3：Docker 环境变量**

```bash
docker run \
  -e CORS_ORIGIN="https://yourdomain.com" \
  -p 3000:3000 \
  dailyuse-api:latest
```

---

## 实际案例

### 案例 1：单个域名 + API 子域名

```bash
CORS_ORIGIN=https://app.dailyuse.com,https://api.dailyuse.com
```

### 案例 2：多个环境

```bash
# 生产环境
CORS_ORIGIN=https://dailyuse.com,https://www.dailyuse.com

# 测试环境
CORS_ORIGIN=https://staging.dailyuse.com,https://test.dailyuse.com

# 开发环境
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
```

### 案例 3：微前端架构

```bash
CORS_ORIGIN=https://main-app.com,https://micro-app-1.com,https://micro-app-2.com
```

---

## 调试步骤

### 1. 验证环境变量是否生效

```bash
# 进入容器
docker exec -it <container_id> sh

# 检查环境变量
echo $CORS_ORIGIN
```

### 2. 检查 API 日志

```bash
docker logs <container_id> | grep -i cors
```

### 3. 使用 curl 测试（跳过 CORS 检查）

```bash
# 直接测试 API（不过 CORS）
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 4. 检查浏览器响应头

在 Chrome DevTools → Network 标签中检查：

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 代码实现细节

当前 CORS 中间件的逻辑：

```typescript
// apps/api/src/app.ts

const corsOriginEnv = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = corsOriginEnv
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes('*');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: !allowAllOrigins,  // 关键：通配符时禁用 credentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Skip-Auth', 'Cache-Control'],
    maxAge: 86400,
  }),
);
```

---

## 常见问题

**Q: 为什么使用 `CORS_ORIGIN=*` 时 Cookie 无法发送？**

A: 浏览器出于安全考虑，当 `Access-Control-Allow-Origin: *` 时，禁止发送凭证（Cookie、Authorization）。这是 CORS 规范的限制，不是服务器的问题。

**Q: 如何支持多个子域名？**

A: 可以在前端加载时动态设置。但推荐列出所有预期域名：

```bash
CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com
```

**Q: 本地开发时 `localhost` 和 `127.0.0.1` 是否都要配置？**

A: 建议都配置，因为浏览器将它们视为不同的来源：

```bash
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

**Q: Docker 部署后仍然显示 CORS 错误？**

A: 检查以下几点：

1. ✅ 环境变量是否正确传递到容器
2. ✅ 前端实际域名是否在允许列表中
3. ✅ Docker 网络配置（如使用 host network）
4. ✅ 代理或负载均衡器是否修改了 Origin Header

---

## 最佳实践

1. **生产环境**：使用具体的域名列表，禁用通配符
2. **测试环境**：可使用通配符便于测试，但生产前必须改为具体域名
3. **开发环境**：根据本地开发工具配置（Vite、Webpack 等）
4. **监控**：记录 CORS 错误日志便于问题排查
5. **安全性**：定期审查允许的来源列表

---

## 相关文件

- [apps/api/src/app.ts](../../apps/api/src/app.ts) - CORS 中间件实现
- [docker-compose.prod.yml](../../docker-compose.prod.yml) - Docker 配置
- [../deployment/README.md](../deployment/README.md) - Docker 部署说明
