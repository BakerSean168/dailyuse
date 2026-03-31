---
tags:
  - deployment
  - docker
  - local-development
  - guide
description: 本地开发环境部署指南 - Docker环境配置与服务启动完整流程
created: 2025-11-23T17:25:00
updated: 2025-11-23T17:25:00
---

# 🖥 本地部署指南 - Local Development Setup

> 快速搭建本地开发环境，支持热重载与完整的开发工具链

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [Docker部署](#docker部署)
- [服务配置](#服务配置)
- [开发工具](#开发工具)
- [常见问题](#常见问题)

---

## 💻 环境要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| **Node.js** | 20.x | 20.11+ | JavaScript运行时 |
| **pnpm** | 8.x | 8.15+ | 包管理器 |
| **Docker** | 24.x | 25.x | 容器化服务 |
| **Docker Compose** | 2.x | 2.24+ | 服务编排 |
| **Git** | 2.x | 2.43+ | 版本控制 |

### 可选软件

| 软件 | 推荐版本 | 用途 |
|------|---------|------|
| **VS Code** | 最新版 | 推荐IDE |
| **PostgreSQL Client** | 16.x | 数据库管理 |
| **Redis CLI** | 7.x | Redis调试 |

### 系统要求

- **操作系统**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **内存**: 最低8GB，推荐16GB+
- **磁盘空间**: 最低10GB可用空间
- **网络**: 稳定的互联网连接（首次安装）

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/BakerSean168/dailyuse.git
cd dailyuse
```

### 2. 安装依赖

```bash
# 安装pnpm（如果未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 启动基础服务

```bash
# 启动PostgreSQL + Redis
pnpm docker:services

# 等待服务启动（约10秒）
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
pnpm nx run api:prisma:migrate:dev

# 运行Seed（可选）
pnpm nx run api:prisma:seed
```

### 5. 启动开发服务器

```bash
# 终端1: 启动API服务
pnpm nx serve api

# 终端2: 启动Web应用
pnpm nx serve web

# 终端3（可选）: 启动Desktop应用
pnpm nx serve desktop
```

### 6. 访问应用

- **Web应用**: http://localhost:4200
- **API文档**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api-docs

---

## 🐳 Docker部署

### Docker服务架构

```
┌─────────────────────────────────────────┐
│           Docker Services               │
├─────────────────────────────────────────┤
│  PostgreSQL (5432)                      │
│  Redis (6379)                           │
│  Redis Commander (8081) [可选]         │
└─────────────────────────────────────────┘
```

### 启动所有服务

```bash
# 使用脚本启动（推荐）
pnpm docker:services

# 或直接使用docker-compose
docker-compose up -d postgres redis
```

### 查看服务状态

```bash
# 查看运行中的容器
docker-compose ps

# 查看服务日志
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（危险！）
docker-compose down -v
```

### 重启服务

```bash
# 重启特定服务
docker-compose restart postgres
docker-compose restart redis
```

---

## ⚙️ 服务配置

### PostgreSQL配置

**连接信息**:

```env
# .env.local
DATABASE_URL="postgresql://Memoflow:Memoflow123@localhost:5432/Memoflow_dev"

POSTGRES_USER=Memoflow
POSTGRES_PASSWORD=Memoflow123
POSTGRES_DB=Memoflow_dev
```

**管理数据库**:

```bash
# 使用psql连接
docker exec -it Memoflow-postgres psql -U Memoflow -d Memoflow_dev

# 查看所有表
\dt

# 查看表结构
\d users

# 退出
\q
```

**备份与恢复**:

```bash
# 备份数据库
docker exec Memoflow-postgres pg_dump -U Memoflow Memoflow_dev > backup.sql

# 恢复数据库
docker exec -i Memoflow-postgres psql -U Memoflow Memoflow_dev < backup.sql
```

### Redis配置

**连接信息**:

```env
# .env.local
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Redis CLI操作**:

```bash
# 进入Redis CLI
docker exec -it Memoflow-redis redis-cli

# 查看所有键
KEYS *

# 查看特定键
GET user:123

# 清空数据库（危险！）
FLUSHDB

# 退出
exit
```

**Redis Commander（可视化工具）**:

```bash
# 启动Redis Commander
docker-compose up -d redis-commander

# 访问 http://localhost:8081
```

### 环境变量配置

**创建本地配置文件**:

```bash
# 复制示例配置
cp .env.example .env.local

# 编辑配置
vim .env.local
```

**.env.local 示例**:

```env
# 数据库
DATABASE_URL="postgresql://Memoflow:Memoflow123@localhost:5432/Memoflow_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# API
API_PORT=3000
API_PREFIX="api"

# CORS
CORS_ORIGINS="http://localhost:4200,http://localhost:4300"

# 日志
LOG_LEVEL="debug"
LOG_FORMAT="pretty"

# 邮件（本地开发使用Mailhog）
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@Memoflow.local"

# 文件上传
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

---

## 🛠 开发工具

### VS Code扩展

**推荐扩展** (`.vscode/extensions.json`):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vue.volar",
    "prisma.prisma",
    "nrwl.angular-console",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**安装扩展**:

```bash
# VS Code中按F1，输入:
Extensions: Install Extensions

# 或直接安装推荐扩展
```

### VS Code调试配置

**.vscode/launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "serve", "api", "--inspect"],
      "port": 9229,
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

### Nx Console

**图形化任务管理**:

1. 安装Nx Console扩展
2. 左侧边栏打开Nx Console
3. 可视化执行Nx任务

**常用任务**:

```bash
# 运行开发服务器
pnpm nx serve api
pnpm nx serve web

# 运行测试
pnpm nx test api
pnpm nx test web

# 运行构建
pnpm nx build api
pnpm nx build web

# 运行Lint
pnpm nx lint api
pnpm nx lint web
```

### Prisma Studio

**可视化数据库管理**:

```bash
# 启动Prisma Studio
pnpm nx run api:prisma:studio

# 访问 http://localhost:5555
```

**功能**:
- 可视化数据浏览
- 数据增删改查
- 关系数据导航
- 实时数据更新

---

## 📊 监控与日志

### 应用日志

**查看API日志**:

```bash
# 开发模式（彩色输出）
pnpm nx serve api

# 日志级别
LOG_LEVEL=debug pnpm nx serve api
```

**日志格式**:

```
[Nest] 12345  - 2025-11-23 17:25:00   LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 2025-11-23 17:25:00  INFO [RouterExplorer] Mapped {/api/goals, GET} route
```

### Docker日志

```bash
# 实时查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres

# 查看最近100行日志
docker-compose logs --tail=100 postgres
```

### 性能监控

**NestJS性能分析**:

```typescript
// apps/api/src/main.ts
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // 记录启动时间
  const startTime = Date.now();
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  
  const bootTime = Date.now() - startTime;
  logger.log(`Application started in ${bootTime}ms`);
}
```

---

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用

**问题**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 2. Docker服务启动失败

**问题**:
```
ERROR: Cannot start service postgres: driver failed
```

**解决方案**:

```bash
# 检查Docker状态
docker info

# 重启Docker Desktop
# Windows: 右键托盘图标 → Restart

# 清理Docker缓存
docker system prune -a
```

#### 3. 数据库连接失败

**问题**:
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**解决方案**:

```bash
# 检查PostgreSQL是否运行
docker-compose ps postgres

# 检查连接
telnet localhost 5432

# 重启服务
docker-compose restart postgres
```

#### 4. pnpm install失败

**问题**:
```
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@package/name: Not Found
```

**解决方案**:

```bash
# 清理缓存
pnpm store prune

# 删除node_modules重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 5. Prisma迁移失败

**问题**:
```
Error: Migration `20250101000000_init` failed
```

**解决方案**:

```bash
# 重置数据库（警告：删除所有数据）
pnpm nx run api:prisma:migrate:reset

# 手动修复迁移
pnpm nx run api:prisma:migrate:resolve
```

### 性能问题

#### 构建缓慢

```bash
# 清理Nx缓存
pnpm nx reset

# 使用并行构建
pnpm nx run-many --target=build --all --parallel=4
```

#### 热重载缓慢

```typescript
// vite.config.ts - 优化热重载
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // 关闭错误覆盖
    },
  },
  optimizeDeps: {
    include: ['@dailyuse/contracts'], // 预构建依赖
  },
});
```

---

## 📚 下一步

- [[guides/development/setup|完整开发环境配置]]
- [[guides/development/debugging|调试指南]]
- [[guides/deployment/staging|预发布环境部署]]
- [[guides/troubleshooting/common-errors|常见错误解决]]

---

## 🔗 相关资源

- [[ops/docker/DOCKER_SERVICES_GUIDE|Docker服务指南]]
- [[ops/docker/DOCKER_CONFIG_UNIFIED|Docker配置说明]]
- [[reference/configuration/README|配置参考]]
- [[getting-started/quick-start|快速开始]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0



