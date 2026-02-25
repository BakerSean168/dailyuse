# Docker 构建指南

本文档详细介绍 Docker 镜像构建的核心概念、最佳实践，以及本项目的 Dockerfile 设计原理。

## 目录

1. [Docker 构建基础](#1-docker-构建基础)
2. [多阶段构建详解](#2-多阶段构建详解)
3. [pnpm Monorepo 构建策略](#3-pnpm-monorepo-构建策略)
4. [缓存优化技巧](#4-缓存优化技巧)
5. [常见问题与解决方案](#5-常见问题与解决方案)
6. [本项目 Dockerfile 解析](#6-本项目-dockerfile-解析)

---

## 1. Docker 构建基础

### 1.1 Dockerfile 指令概览

| 指令          | 作用           | 示例                                              |
| ------------- | -------------- | ------------------------------------------------- |
| `FROM`        | 指定基础镜像   | `FROM node:22-alpine`                             |
| `WORKDIR`     | 设置工作目录   | `WORKDIR /app`                                    |
| `COPY`        | 复制文件到镜像 | `COPY package.json ./`                            |
| `RUN`         | 执行命令       | `RUN pnpm install`                                |
| `ENV`         | 设置环境变量   | `ENV NODE_ENV=production`                         |
| `ARG`         | 定义构建参数   | `ARG VITE_API_URL`                                |
| `EXPOSE`      | 声明端口       | `EXPOSE 3000`                                     |
| `CMD`         | 容器启动命令   | `CMD ["node", "dist/index.js"]`                   |
| `HEALTHCHECK` | 健康检查       | `HEALTHCHECK CMD curl -f http://localhost/health` |

### 1.2 镜像分层原理

Docker 镜像由多个**只读层（Layer）**组成，每条指令创建一层：

```
┌─────────────────────────────┐
│  CMD ["node", "index.js"]   │  ← 第 N 层（元数据）
├─────────────────────────────┤
│  RUN pnpm build             │  ← 第 N-1 层
├─────────────────────────────┤
│  COPY . .                   │  ← 第 N-2 层
├─────────────────────────────┤
│  RUN pnpm install           │  ← 第 N-3 层（通常最大）
├─────────────────────────────┤
│  COPY package.json ./       │  ← 第 N-4 层
├─────────────────────────────┤
│  FROM node:22-alpine        │  ← 基础镜像层
└─────────────────────────────┘
```

**关键理解**：

- 每层是增量的，只存储与上一层的差异
- 层一旦创建就不可变，可被多个镜像共享
- **缓存失效是级联的**：某层变化，其后所有层都需重建

### 1.3 构建上下文（Build Context）

```bash
docker build -f Dockerfile.api -t myapp:v1.0.0 .
#                                              ↑
#                                    这个 "." 就是构建上下文
```

构建上下文是 Docker 发送给守护进程的文件集合。**关键点**：

1. **上下文越大，构建越慢** —— 因为需要先传输到 Docker 守护进程
2. 使用 `.dockerignore` 排除不需要的文件：

```dockerignore
# .dockerignore 示例
node_modules
dist
.git
*.log
.env*
```

---

## 2. 多阶段构建详解

### 2.1 为什么需要多阶段构建？

单阶段构建的问题：

```dockerfile
# ❌ 不推荐：单阶段构建
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install           # 包含 devDependencies
RUN pnpm build
CMD ["node", "dist/index.js"]
# 最终镜像包含：源码 + devDeps + 构建工具 = 体积巨大
```

多阶段构建的优势：

```dockerfile
# ✅ 推荐：多阶段构建
FROM node:22-alpine AS builder    # 阶段 1：构建
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

FROM node:22-alpine               # 阶段 2：生产
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod
CMD ["node", "dist/index.js"]
# 最终镜像只包含：运行时必需文件 = 体积精简
```

### 2.2 阶段命名与引用

```dockerfile
# 命名构建阶段
FROM node:22-alpine AS builder
FROM node:22-alpine AS tester
FROM node:22-alpine AS production

# 从指定阶段复制文件
COPY --from=builder /app/dist ./dist
COPY --from=tester /app/coverage ./coverage
```

### 2.3 本项目的两阶段设计

```
┌────────────────────────────────────────────────────────────┐
│                    Builder 阶段                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • 完整的开发依赖 (devDependencies)                   │  │
│  │ • TypeScript 编译器                                  │  │
│  │ • 构建工具 (tsup, vite 等)                          │  │
│  │ • 源代码                                             │  │
│  │ • 生成的构建产物 (dist/)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓ COPY --from=builder             │
│                    只复制必需文件                           │
│                          ↓                                 │
├────────────────────────────────────────────────────────────┤
│                   Production 阶段                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • 构建产物 (dist/)                                   │  │
│  │ • 生产依赖 (dependencies only)                       │  │
│  │ • 运行时配置                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. pnpm Monorepo 构建策略

### 3.1 Monorepo 的挑战

在 monorepo 中构建 Docker 镜像面临特殊挑战：

1. **workspace 协议**：`"@dailyuse/utils": "workspace:*"` 需要本地包存在
2. **lockfile 一致性**：`pnpm-lock.yaml` 记录了整个 workspace 的依赖关系
3. **配置文件依赖**：`package.json` 中的 `overrides`、`pnpmfile.cjs` 等

### 3.2 pnpm fetch + offline install 策略

本项目采用的最佳实践：

```dockerfile
# 步骤 1：只复制锁文件相关配置
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 步骤 2：预拉取依赖到 pnpm store（不需要 package.json 内容）
RUN pnpm fetch

# 步骤 3：复制所有源代码
COPY packages ./packages
COPY apps/api ./apps/api

# 步骤 4：离线安装（从 store 链接，无需网络）
RUN pnpm install --frozen-lockfile --ignore-scripts --offline
```

**为什么这样设计？**

| 步骤               | 目的                       | 缓存效果                             |
| ------------------ | -------------------------- | ------------------------------------ |
| `pnpm fetch`       | 仅根据 lockfile 下载包     | 只要 lockfile 不变，此层永远命中缓存 |
| `--offline`        | 使用已下载的包，无网络请求 | 避免构建时的网络不稳定               |
| `--ignore-scripts` | 跳过 prepare/postinstall   | 避免 monorepo 中子包脚本失败         |

### 3.3 生产阶段的关键配置

```dockerfile
# ⚠️ 必须复制根 package.json（包含 overrides 配置）
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
```

**常见错误**：忘记复制根 `package.json`，导致：

```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
Cannot proceed with the frozen installation.
The current "overrides" configuration doesn't match the value found in the lockfile
```

---

## 4. 缓存优化技巧

### 4.1 指令顺序的黄金法则

**变化频率低的指令放前面，变化频率高的放后面**：

```dockerfile
# ✅ 正确顺序
FROM node:22-alpine
RUN corepack enable                    # 几乎不变
WORKDIR /app                           # 几乎不变
COPY package.json pnpm-lock.yaml ./    # 依赖变化时才变
RUN pnpm fetch                         # 依赖变化时才变
COPY . .                               # 代码经常变
RUN pnpm build                         # 代码变就要重建
```

```dockerfile
# ❌ 错误顺序
FROM node:22-alpine
COPY . .                               # 任何文件变化都失效
RUN pnpm install                       # 每次都重新安装
RUN pnpm build
```

### 4.2 利用 BuildKit 缓存挂载

```dockerfile
# 使用缓存挂载加速 pnpm 安装
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
```

### 4.3 .dockerignore 最佳实践

```dockerignore
# 排除开发时产物
node_modules
dist
.nx
.cache

# 排除版本控制
.git
.gitignore

# 排除测试和文档
**/*.test.ts
**/*.spec.ts
coverage
docs

# 排除环境配置
.env*
*.local

# 排除 IDE 配置
.vscode
.idea
```

---

## 5. 常见问题与解决方案

### 5.1 lockfile 不匹配

**错误信息**：

```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
```

**原因**：生产阶段缺少根 `package.json`（包含 `overrides`、`resolutions` 等配置）

**解决**：

```dockerfile
COPY --from=builder /app/package.json ./
```

### 5.2 Node 版本不匹配

**警告信息**：

```
WARN  Unsupported engine: wanted: {"node":">=22.0.0"}
```

**原因**：Dockerfile 使用的 Node 版本低于项目要求

**解决**：确保基础镜像版本与 `package.json` 中 `engines.node` 一致

```dockerfile
FROM node:22-alpine  # 不是 node:20-alpine
```

### 5.4 网络超时

**错误信息**：

```
Error when performing the request to https://registry.npmjs.org/...
```

**解决方案**：

1. 使用 `pnpm fetch` + `--offline` 分离网络步骤
2. 配置 npm 镜像（中国大陆用户）：

```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

---

## 6. 本项目 Dockerfile 解析

### 6.1 API Dockerfile 完整解析

```dockerfile
# ==================================================
# 阶段 1: Builder - 构建应用
# ==================================================
FROM node:22-alpine AS builder

# 启用 corepack 并固定 pnpm 版本（与 package.json 中 packageManager 一致）
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

# 复制依赖描述文件（变化频率低，利于缓存）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 预拉取依赖到 store（仅依赖 lockfile，与源码解耦）
RUN pnpm fetch

# 复制源代码（变化频率高）
COPY packages ./packages
COPY apps/api ./apps/api

# 离线安装 + 跳过脚本（避免 prepare 等钩子在不完整环境下执行）
RUN pnpm install --frozen-lockfile --ignore-scripts --offline

# 进入 API 目录执行特定构建
WORKDIR /app/apps/api
RUN pnpm prisma:generate  # 生成 Prisma Client
RUN pnpm build            # TypeScript 编译

# ==================================================
# 阶段 2: Production - 最小化运行时镜像
# ==================================================
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma

# 复制 workspace 配置（关键：包含 overrides 等配置）
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 生成 Prisma Client（生产镜像中需要）
RUN pnpm prisma:generate

# 运行时配置
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "dist/index.js"]
```

### 6.2 Web Dockerfile 特点

Web 前端的 Dockerfile 更简单，因为最终产物是静态文件：

```dockerfile
# Builder 阶段：构建前端
FROM node:22-alpine AS builder
# ... (类似 API 的依赖安装)
RUN pnpm build  # 输出到 dist/

# Production 阶段：Nginx 静态服务
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

**为什么 Web 不需要 Node 运行时？**

- Vite 构建输出纯静态文件（HTML/CSS/JS）
- 运行时只需 HTTP 服务器（Nginx 更轻量高效）

---

## 附录：快速参考

### 构建命令

```bash
# 构建单个镜像
docker build -f Dockerfile.api -t dailyuse-api:v1.0.0 .

# 使用脚本构建
.\build-and-push.ps1 -ImageNamespace yourname -Tag v1.0.0

# 构建并推送
.\build-and-push.ps1 -ImageNamespace yourname -Tag v1.0.0 -Push

# 查看镜像大小
docker images | grep dailyuse
```

### 调试技巧

```bash
# 进入构建阶段调试
docker build --target builder -t debug:latest .
docker run -it debug:latest sh

# 查看镜像层
docker history dailyuse-api:v1.0.0

# 检查镜像内容
docker run --rm dailyuse-api:v1.0.0 ls -la /app
```

### 清理命令

```bash
# 清理构建缓存
docker builder prune

# 清理悬空镜像
docker image prune

# 清理所有未使用资源
docker system prune -a
```

---

**最后更新**: 2024-12-21
