# 🔐 环境变量完整配置

**概览**：所有可用环境变量的文档和最佳实践

---

## 快速配置模板

### 开发环境 (`.env.development`)
```env
NODE_ENV=development
API_PORT=3000
API_HOSTNAME=0.0.0.0
LOG_LEVEL=debug

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=Memoflow_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Memoflow_dev

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:4200
CORS_CREDENTIALS=false
```

### 生产环境 (`.env.production`)
```env
NODE_ENV=production
API_PORT=3000
API_HOSTNAME=0.0.0.0
LOG_LEVEL=warn

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=Memoflow
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here_min_16_chars
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/Memoflow

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here_min_16_chars

JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# 监控和安全
SENTRY_DSN=https://your-sentry-dsn@sentry.io/xxxxx
```

---

## 完整变量参考

### 🟢 应用基础配置

| 变量 | 描述 | 示例值 | 必需 | 默认值 |
|------|------|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` / `development` | ✅ | - |
| `API_PORT` | 应用端口 | `3000` | ✅ | 3000 |
| `API_HOSTNAME` | 绑定地址 | `0.0.0.0` / `127.0.0.1` | ❌ | `0.0.0.0` |
| `LOG_LEVEL` | 日志级别 | `debug` / `info` / `warn` / `error` | ❌ | `info` |
| `APP_VERSION` | 应用版本 | `1.0.3` | ❌ | `unknown` |

**配置示例：**
```env
NODE_ENV=production
API_PORT=3000
API_HOSTNAME=0.0.0.0
LOG_LEVEL=warn
APP_VERSION=1.0.3
```

---

### 🔵 数据库配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `DATABASE_HOST` | 数据库主机 | `postgres` / `db.example.com` | ✅ | Docker 容器名或主机名 |
| `DATABASE_PORT` | 数据库端口 | `5432` | ✅ | PostgreSQL 默认端口 |
| `DATABASE_NAME` | 数据库名 | `Memoflow` | ✅ | 必须提前创建 |
| `DATABASE_USER` | 数据库用户 | `postgres` | ✅ | 非 root 用户更安全 |
| `DATABASE_PASSWORD` | 数据库密码 | `SecurePass123!` | ✅ | 最少 16 个字符（生产） |
| `DATABASE_URL` | 完整连接字符串 | `postgresql://...` | ✅ | Prisma ORM 使用 |

**配置示例：**
```env
# 开发环境
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=Memoflow_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Memoflow_dev

# 生产环境
DATABASE_HOST=db-primary.internal
DATABASE_PORT=5432
DATABASE_NAME=Memoflow_prod
DATABASE_USER=app_user
DATABASE_PASSWORD=SecurePassword123!@#
DATABASE_URL=postgresql://app_user:SecurePassword123!@#@db-primary.internal:5432/Memoflow_prod
```

**验证数据库连接：**
```bash
# 使用 psql 客户端
psql $DATABASE_URL -c "SELECT 1"
# 预期输出：1 行，表示连接成功
```

---

### 🟣 Redis 缓存配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `REDIS_HOST` | Redis 主机 | `redis` / `cache.example.com` | ✅ | Docker 容器名或主机名 |
| `REDIS_PORT` | Redis 端口 | `6379` | ✅ | Redis 默认端口 |
| `REDIS_PASSWORD` | Redis 密码 | `SecurePass123!` | ❌ | 生产环境必需 |
| `REDIS_DATABASE` | Redis 数据库号 | `0` | ❌ | 0-15 之间 |
| `REDIS_URL` | 完整连接 URL | `redis://:pass@host:6379/0` | ❌ | 可用于覆盖上述变量 |

**配置示例：**
```env
# 开发环境（无密码）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DATABASE=0

# 生产环境（有密码）
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPass123!
REDIS_DATABASE=0

# 或使用 URL 方式
REDIS_URL=redis://:SecureRedisPass123!@redis.internal:6379/0
```

**验证 Redis 连接：**
```bash
# 使用 redis-cli
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# 预期输出：PONG
```

---

### 🟠 JWT 认证配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key-here` | ✅ | 最少 32 个字符 |
| `JWT_EXPIRES_IN` | 令牌过期时间 | `7d` / `24h` / `3600` | ❌ | 默认 7 天 |
| `JWT_ALGORITHM` | 签名算法 | `HS256` / `RS256` | ❌ | 默认 HS256 |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | `refresh-secret-key` | ❌ | 如需刷新令牌 |
| `JWT_REFRESH_EXPIRES_IN` | 刷新令牌过期 | `30d` | ❌ | 通常比 JWT 更长 |

**配置示例：**
```env
# 开发环境
JWT_SECRET=dev-secret-this-should-be-longer-than-32-chars
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256

# 生产环境（强密钥）
JWT_SECRET=YKw8FGx@9dL2pQs*mNv#5hJr$8tWx&3Zc7aB!4eD%F6gHj
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=Bx@2pL$9kQ#7mN!5hJ*3tW%8rF&4aD$6eG#2sH@9vC%1xY
JWT_REFRESH_EXPIRES_IN=30d
JWT_ALGORITHM=HS256
```

**生成强密钥：**
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 🟡 CORS 跨域配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `CORS_ORIGIN` | 允许的源 | `https://yourdomain.com,https://www.yourdomain.com` | ✅ | 逗号分隔的列表或 `*` |
| `CORS_CREDENTIALS` | 允许凭证 | `true` / `false` | ✅ | 若为 true，CORS_ORIGIN 不能是 `*` |
| `CORS_METHODS` | 允许的方法 | `GET,POST,PUT,DELETE,OPTIONS` | ❌ | 默认：所有主要方法 |
| `CORS_ALLOWED_HEADERS` | 允许的请求头 | `Content-Type,Authorization` | ❌ | 默认：常用请求头 |
| `CORS_EXPOSED_HEADERS` | 暴露的响应头 | `X-Total-Count,X-Page` | ❌ | 前端可访问的响应头 |
| `CORS_MAX_AGE` | 预检缓存(秒) | `86400` | ❌ | 默认 86400 (1天) |

**配置示例：**
```env
# 开发环境（允许所有）
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# 生产环境（特定域名）
CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
CORS_EXPOSED_HEADERS=X-Total-Count,X-Page-Number,X-Page-Size
CORS_MAX_AGE=86400
```

**详细指南：** 见 [CORS_CONFIGURATION.md](CORS_CONFIGURATION.md)

---

### 🔴 安全与监控配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `SENTRY_DSN` | Sentry 错误追踪 | `https://xxx@sentry.io/xxx` | ❌ | 用于生产错误报告 |
| `RATE_LIMIT_WINDOW` | 速率限制窗口(ms) | `60000` | ❌ | 默认 1 分钟 |
| `RATE_LIMIT_MAX` | 速率限制最大次数 | `100` | ❌ | 默认 100 请求/分钟 |
| `HELMET_ENABLED` | Helmet 安全头 | `true` / `false` | ❌ | 默认启用 |
| `TRUST_PROXY` | 信任代理 | `true` / `false` / `["ip"]` | ❌ | 用于反向代理 |

**配置示例：**
```env
# 生产安全配置
SENTRY_DSN=https://1234567890abc@sentry.io/987654321
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
HELMET_ENABLED=true
TRUST_PROXY=true
```

---

### 🟢 第三方集成配置

| 变量 | 描述 | 示例值 | 必需 | 说明 |
|------|------|--------|------|------|
| `SMTP_HOST` | SMTP 服务器 | `smtp.gmail.com` | ❌ | 用于发送邮件 |
| `SMTP_PORT` | SMTP 端口 | `587` | ❌ | 587 (TLS) 或 465 (SSL) |
| `SMTP_USER` | SMTP 用户名 | `noreply@yourdomain.com` | ❌ | 发件邮箱 |
| `SMTP_PASSWORD` | SMTP 密码 | `app-password` | ❌ | 应用专用密码 |
| `SMTP_FROM` | 默认发件人 | `noreply@yourdomain.com` | ❌ | 邮件显示的发件人 |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-...` | ❌ | 用于 AI 功能 |
| `OPENAI_MODEL` | OpenAI 模型 | `gpt-4` / `gpt-3.5-turbo` | ❌ | 默认 gpt-3.5-turbo |

**配置示例：**
```env
# SMTP 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=app-specific-password-here
SMTP_FROM=Memoflow <noreply@yourdomain.com>

# OpenAI 配置
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyz
OPENAI_MODEL=gpt-4
```

---

## 环境变量加载优先级

系统按以下顺序加载环境变量（后面的覆盖前面的）：

```
1. .env 文件（基础配置）
     ↓ 覆盖
2. .env.{NODE_ENV} 文件（环境特定）
     ↓ 覆盖
3. .env.local 文件（本地覆盖）
     ↓ 覆盖
4. .env.{NODE_ENV}.local 文件（环境特定本地）
     ↓ 覆盖
5. 操作系统环境变量（最高优先级）
```

**示例：**
```bash
# 假设 NODE_ENV=production

# 加载顺序：
1. .env
2. .env.production
3. .env.local (if exists)
4. .env.production.local (if exists)
5. export DATABASE_PASSWORD=xxx (OS env)
```

---

## 环境变量验证

### 启动时检查

服务启动时自动验证所有必需变量。如果缺少必需变量，会显示：

```
❌ Environment validation failed:
  DATABASE_URL: required field
  JWT_SECRET: required field (minimum 32 characters)
  CORS_ORIGIN: required field
```

### 手动验证

```bash
# 检查是否设置了变量
test -n "$DATABASE_URL" && echo "DATABASE_URL is set" || echo "DATABASE_URL is missing"

# 验证 URL 格式
grep -E "^postgresql://" <<< "$DATABASE_URL" && echo "✅ Valid" || echo "❌ Invalid"
```

---

## 安全最佳实践

### ✅ 应该做的

```env
# 1. 使用强随机密码（最少 16 个字符）
DATABASE_PASSWORD=Xk9mL@2pN#5qR$8tW%7vC&3yF*4aB!6dE

# 2. 不同环境使用不同密钥
# .env.development
JWT_SECRET=dev-key-short-is-ok

# .env.production
JWT_SECRET=YKw8FGx@9dL2pQs*mNv#5hJr$8tWx&3Zc7aB!4eD%F6gHj

# 3. 在 .env.local 中覆盖敏感信息
cat > .env.local << 'EOF'
DATABASE_PASSWORD=your-local-password
JWT_SECRET=your-local-secret
EOF

# 4. 将 .env.local 添加到 .gitignore
echo ".env.local" >> .gitignore
```

### ❌ 不应该做的

```env
# ❌ 不要使用简单密码
DATABASE_PASSWORD=123456

# ❌ 不要在代码中硬编码密钥
JWT_SECRET=secret

# ❌ 不要在 Git 中提交 .env 文件
git add .env  # 🚫 DO NOT DO THIS

# ❌ 不要在日志中打印敏感信息
console.log(`JWT_SECRET: ${JWT_SECRET}`)  // 🚫 DO NOT DO THIS
```

---

## 密码生成工具

### 使用 OpenSSL 生成强密码
```bash
# 32 字节（256 位）的随机字符串
openssl rand -base64 32

# 示例输出
YKw8FGx@9dL2pQs*mNv#5hJr$8tWx&3Zc7aB!4eD%F6gHj=
```

### 使用 Node.js 生成
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 示例输出
c7f3e5a2b1d4c8f6e2a5b3d7c1f4a8e2d6b9f3c7a1e5d8b2c6f9a3e7
```

### 使用 Python 生成
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 示例输出
-K5VzGqPa2bWxYzL8mN3pQr4sTuVwXyZaB1cDeF2gHi
```

---

## 常见配置错误

### ❌ 错误 1：DATABASE_URL 格式错误
```env
# ❌ 错误格式
DATABASE_URL=localhost:5432/Memoflow

# ✅ 正确格式
DATABASE_URL=postgresql://postgres:password@localhost:5432/Memoflow
```

### ❌ 错误 2：CORS_ORIGIN 与 CORS_CREDENTIALS 冲突
```env
# ❌ 错误配置
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# ✅ 正确配置（任选其一）
# 方案 A：允许所有源，不发送凭证
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# 方案 B：特定源，允许凭证
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
```

### ❌ 错误 3：JWT_SECRET 太短
```env
# ❌ 错误（少于 32 字符）
JWT_SECRET=short

# ✅ 正确（至少 32 字符）
JWT_SECRET=YKw8FGx@9dL2pQs*mNv#5hJr$8tWx&3Zc7aB!4eD%F6gHj
```

---

## 变量插值支持

系统支持使用 `${VAR_NAME}` 进行变量插值：

```env
# .env 中定义基础变量
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=Memoflow

# 可以引用其他变量
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# 解析后
DATABASE_URL=postgresql://postgres:password@localhost:5432/Memoflow
```

---

## 帮助和验证

**查看当前加载的环境变量：**
```bash
# 在应用日志中查看
docker-compose logs api | grep "Environment loaded"

# 或进入容器检查
docker exec Memoflow-api env | grep -E "^(DATABASE_|REDIS_|JWT_|CORS_)"
```

**验证环境配置：**
```bash
# 检查是否所有必需变量都已设置
./scripts/validate-env.sh

# 或手动检查
env | grep -E "^(NODE_ENV|DATABASE_URL|JWT_SECRET|CORS_ORIGIN)"
```

---

更多帮助见 [../README.md](../README.md) 或 [../05-troubleshooting.md](../05-troubleshooting.md)。

