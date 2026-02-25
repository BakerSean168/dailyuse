# DailyUse 项目概览

> **更新时间**: 2025-12-16
> **文档版本**: 2.0.0
> **项目版本**: 0.2.x

---

## 📋 项目概要

**DailyUse** 是一个基�?Electron + Vue 3/React 19 + TypeScript 的现代化个人效率管理平台，采�?Nx Monorepo 架构。该项目结合了桌面应用、Web 应用和后�?API 服务，为用户提供跨平台的生产力工具�?

### 核心特�?

- �?\*_跨平�?_: Windows/macOS/Linux 支持
- �?**离线优先**: 本地 SQLite 数据�?
- �?\*_模块化架�?_: Nx Monorepo + DDD 领域驱动设计
- �?**全栈 TypeScript**: 类型安全的前后端代码
- �?**现代 UI**: Vuetify 3 (Web) + shadcn/ui (Desktop)
- �?\*_多框架渲�?_: Desktop 采用 React 19，Web 采用 Vue 3

---

## 🏗�?仓库结构

**仓库类型**: Nx Monorepo  
**包管理器**: pnpm v10.18.3  
**构建工具**: Nx v21.4.1 + Vite v7.1.7

### 架构组成

```
DailyUse/
├── apps/                       # 应用程序 (3个独立应�?
�?  ├── api/                   # Node.js 后端 API 服务
�?  ├── web/                   # Vue 3 Web 应用
�?  └── desktop/               # Electron 桌面应用 (React 19)
├── packages/                   # 共享代码�?(16个核心包)
�?  ├── contracts/             # TypeScript 类型定义和接口契�?
�?  ├── domain-client/         # 客户端业务逻辑�?
�?  ├── domain-server/         # 服务端业务逻辑�?
�?  ├── application-client/    # 客户端应用服务层
�?  ├── application-server/    # 服务端应用服务层
�?  ├── infrastructure-client/ # 客户端基础设施�?(IPC Client)
�?  ├── infrastructure-server/ # 服务端基础设施�?(DI Container)
�?  ├── ui-vue/                # Vue 3 组件�?
�?  ├── ui-vuetify/            # Vuetify 3 组件�?
�?  ├── ui-react/              # React 组件�?
�?  ├── ui-react-shadcn/             # shadcn/ui 组件�?
�?  ├── ui-core/               # 框架无关 UI 核心
�?  ├── utils/                 # 工具函数和实用程�?
�?  ├── assets/                # 共享资源 (图标、字体等)
�?  └── test-utils/            # 测试工具�?
├── docs/                       # 项目文档
├── tools/                      # 构建和开发工�?
└── .bmad/                      # BMAD Method v6 (开发方法论)
```

---

## 🎯 应用部分详情

### Part 1: API Backend

**路径**: `apps/api/`  
**类型**: Node.js 后端服务  
**包名**: `@dailyuse/api`

#### 技术栈

| 组件         | 技�?                    | 版本     |
| ------------ | ----------------------- | -------- |
| \*_运行�?_   | Node.js                 | 22.20.0+ |
| **框架**     | Express                 | 5.2.1    |
| \*_数据�?_   | Prisma + PostgreSQL     | 6.17.1   |
| **验证**     | Zod                     | 4.1.13   |
| **认证**     | JWT (jsonwebtoken)      | 9.0.2    |
| **API 文档** | Swagger (swagger-jsdoc) | 6.2.8    |
| **构建工具** | tsup                    | 8.5.0    |

#### 核心功能

- RESTful API 端点
- JWT 认证和授�?
- Prisma ORM 数据访问
- Swagger API 文档
- 定时任务调度 (node-cron)
- 数据库迁移管�?

#### 入口文件

- `src/index.ts` - 应用主入�?
- `prisma/schema.prisma` - 数据库模式定�?(1620�? 50+ 模型)

---

### Part 2: Web Application

**路径**: `apps/web/`  
**类型**: Vue 3 单页应用  
**包名**: `@dailyuse/web`

#### 技术栈

| 组件             | 技�?                    | 版本   |
| ---------------- | ----------------------- | ------ |
| **框架**         | Vue 3 (Composition API) | 3.4.21 |
| \*_UI �?_        | Vuetify 3               | 3.7.5  |
| \*_状态管�?_     | Pinia + persistedstate  | 3.0.3  |
| **路由**         | Vue Router 4            | 4.x    |
| \*_HTTP 客户�?_  | Axios                   | 1.9.0  |
| **富文本编辑器** | TipTap 3                | 3.6.6  |
| **图表**         | ECharts + vue-echarts   | 5.6.0  |
| \*_代码编辑�?_   | Monaco Editor           | 0.52.2 |
| **构建工具**     | Vite                    | 7.1.7  |

#### 核心功能

- 响应�?Material Design UI
- Pinia 状态持久化
- 国际�?(vue-i18n)
- Markdown 编辑和预�?
- 数据可视�?(ECharts)
- E2E 测试 (Playwright)

#### 入口文件

- `src/main.ts` - 应用主入�?
- `src/router/index.ts` - 路由配置
- `src/stores/` - Pinia stores

---

### Part 3: Desktop Application

**路径**: `apps/desktop/`  
**类型**: Electron 桌面应用  
**包名**: `@dailyuse/desktop`

#### 技术栈

| 组件           | 技�?                       | 版本    |
| -------------- | -------------------------- | ------- |
| **桌面框架**   | Electron                   | 39.2.6  |
| **前端**       | React 19                   | 19.2.1  |
| \*_状态管�?_   | Zustand                    | 5.0.5   |
| \*_UI �?_      | shadcn/ui + Tailwind CSS 4 | -       |
| \*_本地数据�?_ | better-sqlite3             | 11.10.0 |
| **文件监控**   | chokidar                   | 4.0.3   |
| **Git 集成**   | simple-git                 | 3.27.0  |
| **任务调度**   | node-schedule              | 2.1.1   |
| **日志**       | electron-log               | 5.4.2   |
| **打包**       | electron-builder           | 26.0.12 |
| **自动更新**   | electron-updater           | 6.6.2   |

#### 核心功能

- 原生桌面应用体验 (React 19 渲染)
- 本地 SQLite 数据存储
- 系统托盘集成
- 快捷键支�?(Alt+Space)
- 桌面通知
- 文件系统监控
- Git 版本控制集成
- 自动更新 (electron-updater)

#### 入口文件

- `src/main/index.ts` - Electron 主进�?
- `src/renderer/main.tsx` - 渲染进程 (React app)

---

## 📦 共享包详�?

### 基础层包

#### @dailyuse/contracts

**功能**: TypeScript 类型定义和接口契�? \*_用�?_: 跨应用类型共享，确保前后端类型一致�?

**关键导出**:

- DTO (Data Transfer Objects)
- API 请求/响应类型
- 领域模型接口
- 枚举和常�?

#### @dailyuse/utils

**功能**: 工具函数和实用程�? \*_用�?_: 跨应用共享的通用功能

**关键模块**:

- API 响应处理系统
- Logger 日志系统
- SSE (Server-Sent Events)
- 初始化管理器
- 验证工具
- 事件总线

#### @dailyuse/assets

**功能**: 共享资源  
\*_用�?_: 图标、字体、图片等静态资�?

---

### 领域层包

#### @dailyuse/domain-client

**功能**: 客户端业务逻辑�? \*_用�?_: Web �?Desktop 应用共享的业务逻辑

**关键模块**:

- 实体�?(Goal, Task, Reminder, etc.)
- Repository 接口
- 状态管理服�?

#### @dailyuse/domain-server

**功能**: 服务端业务逻辑�? \*_用�?_: API �?Desktop Main Process 的业务逻辑

**关键模块**:

- 聚合�?(Aggregate Roots)
- 领域服务 (Domain Services)
- Repository 接口定义

---

### 应用层包

#### @dailyuse/application-client

**功能**: 客户端应用服务层  
\*_用�?_: 协调渲染进程的用例实�?

#### @dailyuse/application-server

**功能**: 服务端应用服务层  
\*_用�?_: 协调服务端的用例实现

---

### 基础设施层包

#### @dailyuse/infrastructure-client

**功能**: 客户端基础设施�? \*_用�?_: IPC Client、API 适配�?

**关键组件**:

- `GoalIpcClient` - 目标模块 IPC 客户�?
- `TaskIpcClient` - 任务模块 IPC 客户�?
- `ScheduleIpcClient` - 日程模块 IPC 客户�?
- ... �?10+ 模块客户�?

#### @dailyuse/infrastructure-server

**功能**: 服务端基础设施�? \*_用�?_: DI 容器、仓储实�?

**关键组件**:

- `GoalContainer` - 目标模块 DI 容器
- `TaskContainer` - 任务模块 DI 容器
- `ScheduleContainer` - 日程模块 DI 容器
- SQLite Repository 适配�?

---

### UI 组件�?

#### @dailyuse/ui-vue

**功能**: Vue 3 通用组件�? \*_用�?_: Vue 应用共享组件

#### @dailyuse/ui-vuetify

**功能**: Vuetify 3 组件封装  
\*_用�?_: Web 应用专用组件

#### @dailyuse/ui-react

**功能**: React 通用组件�? \*_用�?_: React 应用共享组件

#### @dailyuse/ui-react-shadcn

**功能**: shadcn/ui 组件封装  
\*_用�?_: Desktop 应用专用组件

#### @dailyuse/ui-core

**功能**: 框架无关�?UI 核心  
\*_用�?_: 通用 UI 逻辑和样�?

---

### 辅助�?

#### @dailyuse/test-utils

**功能**: 测试工具�? \*_用�?_: 单元测试、集成测试辅助工�?

---

## 📊 包依赖关�?

```
┌─────────────────────────────────────────────────────────────────────�?
�?                       包依赖层级结�?                               �?
├─────────────────────────────────────────────────────────────────────�?
�?                                                                    �?
�? Layer 0: 基础�?(无依�?                                           �?
�? ┌─────────────�?  ┌─────────────�?  ┌─────────────�?              �?
�? �? contracts  �?  �?   utils    �?  �?  assets    �?              �?
�? └──────┬──────�?  └──────┬──────�?  └──────┬──────�?              �?
�?        �?                �?                �?                      �?
�?        └─────────────────┼─────────────────�?                      �?
�?                          �?                                        �?
�? Layer 1: 领域�?(依赖基础�?                                        �?
�? ┌────────────────────�?       ┌────────────────────�?             �?
�? �?  domain-client    �?       �?  domain-server    �?             �?
�? �?  - 客户端实�?     �?       �?  - 聚合�?         �?             �?
�? �?  - 客户端服�?     �?       �?  - Repository接口  �?             �?
�? └─────────┬──────────�?       └─────────┬──────────�?             �?
�?           �?                            �?                         �?
�?           �?                            �?                         �?
�? Layer 2: 应用�?(依赖领域�?                                        �?
�? ┌────────────────────�?       ┌────────────────────�?             �?
�? �?application-client �?       �?application-server �?             �?
�? �?  - 用例实现        �?       �?  - 用例实现        �?             �?
�? �?  - 协调�?         �?       �?  - 协调�?         �?             �?
�? └─────────┬──────────�?       └─────────┬──────────�?             �?
�?           �?                            �?                         �?
�?           �?                            �?                         �?
�? Layer 3: 基础设施�?(依赖应用�?                                    �?
�? ┌────────────────────�?       ┌────────────────────�?             �?
�? �?infrastructure-    �?       �?infrastructure-    �?             �?
�? �?    client         �?       �?    server         �?             �?
�? �?  - IPC Client     �?       �?  - DI Container   �?             �?
�? �?  - Container      �?       �?  - 仓储注册        �?             �?
�? └────────────────────�?       └────────────────────�?             �?
�?           �?                            �?                         �?
�?           �?                            �?                         �?
�?           �?                            �?                         �?
�? ┌────────────────────�?       ┌────────────────────�?             �?
�? �?  Renderer Process �? IPC   �?  Main Process     �?             �?
�? �?  (React App)      │◄─────�?�?  (Electron/API)   �?             �?
�? └────────────────────�?       └────────────────────�?             �?
�?                                                                    �?
└─────────────────────────────────────────────────────────────────────�?
```

### 包使用规�?

| 运行环境             | 可用�?                                                                            | 禁用�?                                                   |
| -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Web 前端**         | contracts, utils, domain-client, application-client, infrastructure-client, ui-\* | domain-server, application-server, infrastructure-server |
| **Desktop 渲染进程** | contracts, utils, domain-client, application-client, infrastructure-client, ui-\* | domain-server, application-server, infrastructure-server |
| \*_Desktop 主进�?_   | contracts, utils, domain-server, application-server, infrastructure-server        | domain-client, application-client, infrastructure-client |
| \*_API 服务�?_       | contracts, utils, domain-server, application-server, infrastructure-server        | domain-client, application-client, infrastructure-client |

---

## 🖥�?Desktop 应用架构

Desktop 应用采用 Electron 多进程架构：

```
┌──────────────────────────────────────────────────────────────�?
�?                   Electron Desktop App                      �?
├──────────────────────────────────────────────────────────────�?
�?                                                             �?
�? ┌────────────────────────────────────────────────────────�?�?
�? �?             Renderer Process (React 19)               �?�?
�? �? ┌──────────────────────────────────────────────────�? �?�?
�? �? �?@dailyuse/infrastructure-client                  �? �?�?
�? �? �?   �?GoalIpcClient, TaskIpcClient, etc.          �? �?�?
�? �? └──────────────────────────────────────────────────�? �?�?
�? └──────────────────────────┬─────────────────────────────�?�?
�?                            �?IPC (contextBridge)           �?
�? ┌──────────────────────────▼─────────────────────────────�?�?
�? �?             Preload Script                            �?�?
�? �? window.electronAPI = { goal, task, schedule, ... }    �?�?
�? └──────────────────────────┬─────────────────────────────�?�?
�?                            �?ipcMain.handle()              �?
�? ┌──────────────────────────▼─────────────────────────────�?�?
�? �?             Main Process (Node.js)                    �?�?
�? �? ┌──────────────────────────────────────────────────�? �?�?
�? �? �?@dailyuse/infrastructure-server                  �? �?�?
�? �? �?   �?GoalContainer, TaskContainer, etc.          �? �?�?
�? �? �?   �?SQLite Repository Adapters                  �? �?�?
�? �? └──────────────────────────────────────────────────�? �?�?
�? �? ┌──────────────────────────────────────────────────�? �?�?
�? �? �?SQLite Database (better-sqlite3)                 �? �?�?
�? �? └──────────────────────────────────────────────────�? �?�?
�? └────────────────────────────────────────────────────────�?�?
�?                                                             �?
└──────────────────────────────────────────────────────────────�?
```

> 📖 详细架构请参�?[Desktop 应用架构](./desktop-architecture.md)

---

## 🎨 业务模块

### 核心模块

1. **Goal (目标管理)**
   - OKR 目标设定
   - Key Results 跟踪
   - 进度自动计算
   - 目标复盘

2. **Task (任务管理)**
   - 任务 CRUD
   - 任务模板和实�?
   - 循环任务
   - 任务依赖
   - 优先级矩�?

3. **Reminder (提醒)**
   - 智能提醒
   - 提醒模板
   - 位置提醒
   - 历史追踪

4. **Notification (通知)**
   - 多渠道通知
   - 优先级分�?
   - 通知摘要
   - 统计分析

5. **Schedule (调度)**
   - 日程管理
   - 冲突检�?
   - 日历视图
   - 时间热力�?

6. **Repository (仓库)**
   - 文档存储
   - 资源管理
   - Markdown 支持
   - 文件夹组�?

7. **AI (智能助手)**
   - AI 对话
   - 目标生成
   - 任务建议
   - 知识生成

8. **Setting (设置)**
   - 用户偏好
   - 主题管理
   - 国际化配�?
   - 编辑器设�?

9. **Account (账户)**
   - 用户管理
   - 认证授权
   - 数据管理

---

## 📊 技术架�?

### 架构模式

- **DDD (领域驱动设计)**: 清晰的业务逻辑分层
- **CQRS**: 命令查询职责分离
- **Event-Driven**: 事件驱动架构
- **Repository Pattern**: 数据访问抽象
- **Dependency Injection**: 依赖注入容器

### 数据�?

```
用户界面 (React/Vue Components)
    �?
应用服务 (Application Services)
    �?
领域服务 (Domain Services)
    �?
仓储�?(Repositories)
    �?
数据�?(Prisma + SQLite/PostgreSQL)
```

### 跨应用通信

- **API �?Web**: HTTP/REST API + SSE
- **API �?Desktop**: HTTP/REST API (本地或远�?
- **Desktop IPC**: Electron IPC (contextBridge)
- **共享逻辑**: 通过 packages 层复�?

---

## 🚀 快速开�?

### 环境要求

- Node.js 22.20.0+
- pnpm 10.0.0+
- PostgreSQL �?SQLite

### 安装

```bash
# 克隆仓库
git clone https://github.com/BakerSean168/DailyUse.git
cd DailyUse

# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁�?
pnpm prisma:migrate
```

### 开发模�?

```bash
# 启动所有服�?(API + Web)
pnpm dev:all

# 或单独启�?
pnpm dev:api      # API 服务 (http://localhost:3888)
pnpm dev:web      # Web 应用 (http://localhost:5173)
pnpm dev:desktop  # 桌面应用
```

### 构建

```bash
# 构建所有应�?
pnpm build

# 或单独构�?
pnpm build:api
pnpm build:web
pnpm build:desktop
```

---

## 📚 文档资源

### 架构文档

- [API 架构文档](./api-architecture.md)
- [Web 架构文档](./web-architecture.md)
- [Desktop 架构文档](./desktop-architecture.md)
- [集成架构文档](./integration-architecture.md)

### 模块文档

- [Goal 模块](../modules/goal/README.md)
- [Task 模块](../modules/task/README.md)
- [Reminder 模块](../modules/reminder/README.md)
- [AI 模块](../modules/ai/README.md)
- [Repository 模块](../modules/repository/README.md)

### 包文�?

- [包索引](../packages-index.md)
- [Contracts 包](../packages-contracts.md)
- [Utils 包](../packages-utils.md)
- [UI 包](../packages-ui.md)

### 开发指�?

- [开发指南](../development-instructions.md)
- [数据模型](../data-models.md)
- [源码树分析](../source-tree-analysis.md)

### ADR (架构决策记录)

- [ADR-001: Nx Monorepo](./adr/001-use-nx-monorepo.md)
- [ADR-002: DDD 模式](./adr/002-ddd-pattern.md)
- [ADR-003: 事件驱动架构](./adr/003-event-driven-architecture.md)
- [ADR-004: Electron Desktop](./adr/004-electron-desktop-architecture.md)
- [ADR-005: UI 多框架](./adr/ADR-005-ui-package-multi-framework.md)
- [ADR-006: Desktop IPC](./adr/ADR-006-desktop-ipc-communication.md)
- [ADR-007: API 一致性](./adr/ADR-007-API-CONSISTENCY.md)

---

## 🔗 相关链接

- \*_主仓�?_: [GitHub - BakerSean168/DailyUse](https://github.com/BakerSean168/DailyUse)
- **Nx 文档**: [https://nx.dev](https://nx.dev)
- **Vue 3 文档**: [https://vuejs.org](https://vuejs.org)
- **React 文档**: [https://react.dev](https://react.dev)
- **Electron 文档**: [https://electronjs.org](https://electronjs.org)
- **Prisma 文档**: [https://prisma.io](https://prisma.io)

---

**文档维护**: 本文档由 BMAD v6 Analyst 自动生成  
\*_最后更�?_: 2025-12-16
