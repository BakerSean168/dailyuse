---
tags:
  - getting-started
  - structure
  - architecture
description: DailyUse项目结构详解
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 📁 Project Structure

了解 DailyUse 的项目结构，帮助你快速定位代码和理解组织方式。

## 📂 目录概览

```
DailyUse/
├── apps/                    # 应用程序
│   ├── api/                # API 服务
│   ├── web/                # Web 应用
│   └── desktop/            # Desktop 应用
├── packages/               # 共享包
│   ├── contracts/          # 类型契约
│   ├── domain-client/      # 客户端领域层
│   ├── domain-server/      # 服务端领域层
│   ├── utils/              # 工具库
│   ├── ui/                 # UI 组件
│   └── assets/             # 静态资源
├── docs/                   # 文档
├── tools/                  # 开发工具
├── nx.json                 # Nx 配置
├── package.json            # 根 package.json
├── pnpm-workspace.yaml     # pnpm workspace 配置
└── tsconfig.base.json      # TypeScript 基础配置
```

## 🏗 应用程序 (apps/)

### API 服务 (apps/api/)

后端 API 服务，使用 NestJS 框架。

```
apps/api/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── goal/            # 目标模块
│   │   ├── task/            # 任务模块
│   │   ├── reminder/        # 提醒模块
│   │   └── ...
│   ├── shared/              # 共享代码
│   │   ├── guards/          # 守卫
│   │   ├── interceptors/    # 拦截器
│   │   ├── filters/         # 异常过滤器
│   │   └── decorators/      # 装饰器
│   ├── main.ts              # 入口文件
│   └── app.module.ts        # 根模块
├── prisma/                   # Prisma 配置
│   ├── schema.prisma        # 数据库模型
│   └── migrations/          # 数据库迁移
├── test/                     # E2E 测试
├── project.json              # Nx 项目配置
└── tsconfig.json             # TypeScript 配置
```

**关键文件**:
- `main.ts`: 应用启动入口
- `app.module.ts`: 根模块，注册所有子模块
- `prisma/schema.prisma`: 数据库模型定义

### Web 应用 (apps/web/)

前端 Web 应用，使用 Vue 3 + TypeScript。

```
apps/web/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── goal/            # 目标模块
│   │   │   ├── domain/      # 领域层（仓储接口）
│   │   │   ├── application/ # 应用层（Service）
│   │   │   ├── infrastructure/ # 基础设施层（API 实现）
│   │   │   └── presentation/ # 表示层（组件、视图）
│   │   │       ├── components/ # 组件
│   │   │       ├── views/    # 页面视图
│   │   │       ├── composables/ # 组合式函数
│   │   │       └── stores/   # 状态管理
│   │   └── ...
│   ├── shared/              # 共享代码
│   │   ├── components/      # 通用组件
│   │   ├── composables/     # 通用 Composables
│   │   ├── utils/           # 工具函数
│   │   └── types/           # 类型定义
│   ├── router/              # 路由配置
│   ├── assets/              # 静态资源
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── index.html                # HTML 模板
├── vite.config.ts            # Vite 配置
├── project.json              # Nx 项目配置
└── tsconfig.json             # TypeScript 配置
```

**关键目录**:
- `modules/*/presentation/`: 每个模块的 UI 组件
- `shared/components/`: 全局共享组件
- `router/`: 路由配置

### Desktop 应用 (apps/desktop/)

桌面应用，使用 Electron + React。

```
apps/desktop/
├── src/
│   ├── main/                # 主进程
│   │   ├── index.ts         # 主进程入口
│   │   ├── ipc/             # IPC 通信
│   │   └── windows/         # 窗口管理
│   ├── renderer/            # 渲染进程（与 web/ 共享代码）
│   └── preload/             # 预加载脚本
├── resources/               # 应用资源（图标等）
├── electron-builder.json    # Electron Builder 配置
├── project.json             # Nx 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 📦 共享包 (packages/)

### contracts (packages/contracts/)

类型契约，定义前后端共享的类型。

```

```

**用途**: 确保前后端类型一致，避免类型不匹配。

### domain-client (packages/domain-client/)

客户端领域层，定义仓储接口和领域服务。

```
packages/domain-client/
├── src/
│   ├── goal/
│   │   ├── repositories/    # 仓储接口
│   │   ├── services/        # 领域服务
│   │   └── models/          # 领域模型
│   └── ...
└── package.json
```

### domain-server (packages/domain-server/)

服务端领域层，定义领域实体和业务逻辑。

```
packages/domain-server/
├── src/
│   ├── goal/
│   │   ├── entities/        # 领域实体
│   │   ├── value-objects/   # 值对象
│   │   ├── services/        # 领域服务
│   │   └── events/          # 领域事件
│   └── ...
└── package.json
```

### utils (packages/utils/)

通用工具函数库。

```
packages/utils/
├── src/
│   ├── date/                # 日期工具
│   ├── string/              # 字符串工具
│   ├── validation/          # 验证工具
│   └── ...
└── package.json
```

### ui (packages/ui/)

共享 UI 组件库。

```
packages/ui/
├── src/
│   ├── components/          # UI 组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   ├── composables/         # 组合式函数
│   └── styles/              # 样式文件
└── package.json
```

## 📚 文档 (docs/)

项目文档，使用 Obsidian 格式。

```
docs/
├── getting-started/         # 入门指南
├── architecture/            # 架构文档
│   └── adr/                # 架构决策记录
├── modules/                # 模块文档
├── guides/                 # 开发指南
│   ├── development/        # 开发指南
│   ├── deployment/         # 部署指南
│   └── troubleshooting/    # 故障排除
├── reference/              # 参考文档
│   ├── api/                # API 文档
│   ├── cli/                # CLI 文档
│   └── configuration/      # 配置文档
├── examples/               # 示例代码
├── contributing/           # 贡献指南
└── README.md               # 文档索引
```

## 🔧 配置文件

### 根目录配置

| 文件 | 用途 |
|------|------|
| `nx.json` | Nx 配置（任务、缓存、生成器） |
| `package.json` | 根 package.json（工作区脚本、依赖） |
| `pnpm-workspace.yaml` | pnpm 工作区配置 |
| `tsconfig.base.json` | TypeScript 基础配置（路径映射） |
| `tsconfig.json` | TypeScript 根配置 |
| `vitest.config.ts` | Vitest 配置 |
| `vitest.workspace.ts` | Vitest 工作区配置 |
| `eslint.config.ts` | ESLint 配置 |
| `.prettierrc` | Prettier 配置 |
| `.gitignore` | Git 忽略配置 |
| `.env` | 环境变量（本地，不提交） |
| `.env.example` | 环境变量模板 |

### 项目级配置

每个应用/包都有自己的配置：

| 文件 | 用途 |
|------|------|
| `project.json` | Nx 项目配置（定义任务） |
| `tsconfig.json` | TypeScript 配置（继承根配置） |
| `vite.config.ts` | Vite 配置（仅前端项目） |
| `package.json` | 项目依赖 |

## 🗺 模块结构 (DDD 分层)

每个业务模块遵循 DDD 分层架构：

```
module/
├── domain/                  # 领域层
│   ├── entities/           # 实体
│   ├── value-objects/      # 值对象
│   ├── aggregates/         # 聚合根
│   ├── repositories/       # 仓储接口
│   ├── services/           # 领域服务
│   └── events/             # 领域事件
├── application/            # 应用层
│   ├── services/           # 应用服务
│   ├── dto/                # 数据传输对象
│   └── mappers/            # 映射器
├── infrastructure/         # 基础设施层
│   ├── repositories/       # 仓储实现
│   ├── adapters/           # 适配器
│   └── persistence/        # 持久化
└── presentation/           # 表示层（仅客户端）
    ├── components/         # 组件
    ├── views/              # 视图
    ├── composables/        # 组合式函数
    └── stores/             # 状态管理
```

详细说明请参考 [[../architecture/system-overview|系统架构]]。

## 📖 如何查找代码？

### 查找业务逻辑

1. **后端 API**: `apps/api/src/modules/{module}/`
2. **前端页面**: `apps/web/src/modules/{module}/presentation/views/`
3. **前端组件**: `apps/web/src/modules/{module}/presentation/components/`
4. **领域模型**: `packages/domain-server/src/{module}/`

### 查找共享代码

1. **类型定义**: `packages/contracts/src/{module}/`
2. **工具函数**: `packages/utils/src/`
3. **UI 组件**: `packages/ui/src/components/`

### 查找配置

1. **数据库模型**: `apps/api/prisma/schema.prisma`
2. **路由配置**: `apps/web/src/router/`
3. **环境变量**: `.env` (参考 `.env.example`)

### 查找测试

1. **单元测试**: 与源文件同目录，`*.spec.ts`
2. **E2E 测试**: `apps/api/test/` 或 `apps/web/e2e/`
3. **测试工具**: `tools/testing/`

## 🎯 命名约定

### 文件命名

- **组件**: `PascalCase.vue` (e.g., `GoalCard.vue`)
- **Service**: `camelCase.service.ts` (e.g., `goal.service.ts`)
- **Repository**: `camelCase.repository.ts` (e.g., `goal.repository.ts`)
- **DTO**: `camelCase.dto.ts` (e.g., `create-goal.dto.ts`)
- **测试**: `*.spec.ts` (e.g., `goal.service.spec.ts`)

### 目录命名

- **模块**: `kebab-case/` (e.g., `goal/`, `task-template/`)
- **分层**: `kebab-case/` (e.g., `domain/`, `application/`)

## 📚 延伸阅读

- [[../architecture/system-overview|📐 系统架构]]
- [[../architecture/api-architecture|🔌 API 架构]]
- [[../architecture/web-architecture|🌐 Web 架构]]
- [[../guides/development/coding-standards|📝 代码规范]]
- [[ddd-patterns|🏛 DDD 模式]]

---

**提示**: 使用 Nx Console (VS Code 插件) 可以可视化查看项目结构和依赖关系！

```bash
# 生成依赖图
pnpm nx graph
```
