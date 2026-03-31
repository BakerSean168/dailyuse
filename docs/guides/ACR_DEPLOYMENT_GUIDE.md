# Aliyun ACR 部署指南

**最新版本**：v1.0.2（修复了 Prisma client 依赖问题）

## 1. 概述

阿里云 ACR（容器镜像服务）是中国区域最快的 Docker 镜像仓库，相比 Docker Hub：
- **网络速度**：快 10-50 倍（无需穿过 Great Firewall）
- **私密性**：私有仓库，控制访问权限
- **可靠性**：地域部署，高可用性
- **成本效益**：免费额度充足

## 2. ACR 仓库信息

项目已迁移到个人 ACR：

```
Registry:  crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
Namespace: bakersean
Region:    cn-hangzhou (杭州)
```

### 2.1 已推送的镜像

#### 应用镜像
- ✅ `Memoflow-api:v1.0.2` - Express API 后端 **（推荐，修复了 Prisma client 缺失问题）**
- `Memoflow-api:v1.0.1` - Express API 后端（有 Prisma 依赖问题，不推荐）
- `Memoflow-web:v1.0.1` - Vue SPA 前端 + Nginx

#### 基础设施镜像
- `postgres:16-alpine` - PostgreSQL 16
- `redis:7-alpine` - Redis 7
- `nginx:alpine` - Nginx

## 3. 生产部署配置

### 3.1 准备 .env 文件

基于 `.env.prod.example` 创建 `.env` 文件：

```bash
# 复制示例配置
cp .env.prod.example .env
```

### 3.2 配置 ACR 信息

编辑 `.env` 文件，设置 ACR 镜像源：

```dotenv
# 镜像仓库配置（使用 ACR）
REGISTRY=crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com
IMAGE_NAMESPACE=bakersean
TAG=v1.0.2

# PostgreSQL 配置
DB_NAME=Memoflow
DB_USER=Memoflow
DB_PASSWORD=<强密码，建议使用: openssl rand -base64 32>
DB_PORT=5432

# Redis 配置
REDIS_PASSWORD=<强密码，建议使用: openssl rand -base64 32>
REDIS_PORT=6379

# API 配置
API_PORT=3000
API_LOG_LEVEL=info

# Web 配置
WEB_PORT=8080

# 应用配置
NODE_ENV=production
```

### 3.3 Docker 登录到 ACR（如需拉取私有镜像）

如果 ACR 仓库设置为私有，需要提前登录：

```bash
# 使用阿里云 RAM 用户的访问密钥
docker login crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com

# 输入用户名和密码
# Username: <your-aliyun-username>
# Password: <your-access-token>
```

> **注意**：个人 ACR 通常允许匿名拉取公开镜像，但推送需要认证。

## 4. 启动服务

### 4.1 使用 docker-compose 启动

```bash
# 使用 ACR 配置启动所有服务
docker compose -f docker-compose.prod.yml --env-file .env up -d

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis
```

### 4.2 验证服务健康状态

```bash
# 检查所有容器的健康状态
docker compose -f docker-compose.prod.yml ps

# 输出示例：
# NAME                       STATUS
# Memoflow-prod-db          Up 2 minutes (healthy)
# Memoflow-prod-redis       Up 2 minutes (healthy)
# Memoflow-prod-api         Up 2 minutes (healthy)
# Memoflow-prod-web         Up 2 minutes (healthy)
```

## 5. 镜像拉取原理

docker-compose.prod.yml 中的镜像配置：

```yaml
postgres:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-bakersean}/postgres:16-alpine

redis:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-bakersean}/redis:7-alpine

api:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-Memoflow}/Memoflow-api:${TAG:-v1.0.0}

web:
  image: ${REGISTRY:-docker.io}/${IMAGE_NAMESPACE:-Memoflow}/Memoflow-web:${TAG:-v1.0.0}
```

**工作原理**：
- 优先使用 `.env` 文件中定义的 `REGISTRY` 和 `IMAGE_NAMESPACE`
- 如果环境变量未定义，使用括号后的默认值
- 例如：`${REGISTRY:-docker.io}` 表示若 `REGISTRY` 未定义则默认使用 `docker.io`

**示例**：

| .env 配置 | 拉取的镜像 URL |
|----------|---------|
| REGISTRY=crpi-... | `crpi-.../bakersean/postgres:16-alpine` |
| REGISTRY=docker.io | `docker.io/bakersean/postgres:16-alpine` |
| 未定义 | 使用默认值 `docker.io` |

## 6. 构建并推送新镜像到 ACR

### 6.1 使用构建脚本

项目提供 PowerShell 脚本快速构建和推送：

```powershell
# Windows PowerShell
.\build-and-push.ps1 -ACR -Tag v1.0.2 -Push

# 参数说明：
# -ACR    : 使用 Aliyun ACR（而非 Docker Hub）
# -Tag    : 镜像标签版本
# -Push   : 构建完成后自动推送到仓库
```

### 6.2 手动构建命令

```bash
# 构建 API 镜像
docker build -f Dockerfile.api -t crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:v1.0.2 .

# 构建 Web 镜像
docker build -f Dockerfile.web -t crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-web:v1.0.2 .

# 推送到 ACR
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:v1.0.2
docker push crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-web:v1.0.2
```

## 7. 常见问题

### 7.1 如何更新镜像版本？

**场景**：发布新版本需要更新生产环境

**步骤**：

1. 修改代码并提交
2. 构建新镜像：
   ```bash
   ./build-and-push.ps1 -ACR -Tag v1.0.2 -Push
   ```
3. 更新 `.env` 文件中的 TAG：
   ```dotenv
   TAG=v1.0.2
   ```
4. 重启服务：
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

### 7.2 如何回滚到之前的版本？

**场景**：新版本出现问题需要快速回滚

**步骤**：

1. 修改 `.env` 文件中的 TAG：
   ```dotenv
   TAG=v1.0.0  # 回滚到之前的版本
   ```
2. 重启服务：
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

### 7.3 如何查看现有镜像？

```bash
# 列出 ACR 中的所有镜像
docker images | grep crpi-3po0rmvmxgu205ms

# 或在阿里云控制台查看：
# https://cr.console.aliyun.com/
```

### 7.4 镜像拉取很慢怎么办？

**可能原因**：
1. 网络连接问题
2. 使用了 Docker Hub 而非 ACR
3. 镜像层缓存未命中

**解决方案**：
1. 检查 `.env` 文件中 `REGISTRY` 是否正确设置为 ACR 地址
2. 检查网络连接：`docker pull crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/postgres:16-alpine`
3. 强制重新拉取：`docker pull --no-cache <image-name>`

### 7.5 如何在服务器之间迁移？

**步骤**：

1. 在新服务器上复制 `.env` 文件（使用相同的 ACR 配置）
2. 克隆项目：
   ```bash
   git clone <repo-url>
   cd dailyuse
   cp .env.prod.example .env
   ```
3. 修改 `.env` 中的敏感信息（数据库密码、Redis 密码等）
4. 启动服务：
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

## 8. 安全最佳实践

### 8.1 密码管理

```bash
# 生成强密码（32 字符）
openssl rand -base64 32

# macOS/Linux 使用 /dev/urandom
python3 -c "import os; print(os.urandom(32).hex())"
```

### 8.2 环境变量保护

```bash
# 确保 .env 文件只有服务器管理员可读
chmod 600 .env

# 不要提交 .env 到 Git（已在 .gitignore 中）
git status  # 验证 .env 未被追踪
```

### 8.3 镜像安全扫描

```bash
# 查看 ACR 中镜像的安全扫描结果
# 登录阿里云控制台 → 容器镜像服务 → 镜像列表 → 安全扫描

# 本地检查：使用 Trivy 扫描镜像漏洞
trivy image crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com/bakersean/Memoflow-api:v1.0.1
```

## 9. 性能优化

### 9.1 镜像分层缓存

构建脚本已使用 Docker 多阶段构建和层缓存：

```dockerfile
# 第一阶段：Builder（包含编译工具）
FROM node:22-alpine AS builder
RUN pnpm fetch  # 缓存依赖层
COPY . .
RUN pnpm build

# 第二阶段：Production（仅包含运行时依赖）
FROM node:22-alpine
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod
```

**优点**：
- 源代码变更不影响依赖缓存
- 生产镜像体积小（仅 ~200MB）
- 重复构建时速度快 10 倍

### 9.2 并行启动优化

docker-compose.prod.yml 使用健康检查进行依赖管理：

```yaml
api:
  depends_on:
    postgres:
      condition: service_healthy  # 等待数据库健康
    redis:
      condition: service_healthy  # 等待缓存健康
```

## 10. 监控和日志

### 10.1 查看容器日志

```bash
# 查看 API 日志（最后 100 行）
docker compose -f docker-compose.prod.yml logs api -n 100

# 实时跟踪日志
docker compose -f docker-compose.prod.yml logs -f api

# 查看所有服务的日志
docker compose -f docker-compose.prod.yml logs -f
```

### 10.2 性能监控

```bash
# 查看容器资源使用情况
docker stats

# 查看具体容器的统计数据
docker stats Memoflow-prod-api

# 输出示例：
# CONTAINER ID   NAME                  CPU %   MEM USAGE / LIMIT
# abc123def456   Memoflow-prod-api     0.5%    120MiB / 256MiB
```

## 11. 参考资源

- [Aliyun ACR 文档](https://help.aliyun.com/zh/acr/)
- [docker-compose 官方文档](https://docs.docker.com/compose/)
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [pnpm 官方文档](https://pnpm.io/)

---

**最后更新**：2024-12-11

**相关文档**：
- [DOCKER_BUILD_GUIDE.md](./DOCKER_BUILD_GUIDE.md) - Docker 构建深度指南
- [docker-compose.prod.yml](../../docker-compose.prod.yml) - 生产环境配置
- [.env.prod.example](../../.env.prod.example) - 环境变量示例


