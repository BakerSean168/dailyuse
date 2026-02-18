# DailyUse - 智能个人效率管理平台

[![pnpm](https://img.shields.io/badge/pnpm-v10.13.0-orange)](https://pnpm.io/)
[![Nx](https://img.shields.io/badge/Nx-v21.4.1-blue)](https://nx.dev/)
[![Vue](https://img.shields.io/badge/Vue-v3.4.21-green)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-v30.5.1-lightgrey)](https://electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8.3-blue)](https://typescriptlang.org/)

一个基于 Electron + Vue 3 + TypeScript 的现代化个人效率管理应用，采用 Nx Monorepo 架构和 pnpm 包管理。

## 🚀 技术栈

### 核心框架

- **前端**: Vue 3 + Vuetify + TypeScript (Web), React + shadcn/ui + TypeScript (Desktop Renderer)
- **桌面**: Electron 30.x
- **后端**: Express + Prisma + PostgreSQL
- **构建**: Nx + Vite + pnpm

### 开发工具

- **包管理**: pnpm (比 npm 快 3x，节省 70% 磁盘空间)
- **构建系统**: Nx Monorepo
- **代码质量**: ESLint + Prettier + TypeScript
- **AI 辅助**: GitHub Copilot + MCP 集成

## 📁 项目结构

```
DailyUse/                    # 根目录
├── apps/                    # 应用程序
│   ├── desktop/            # Electron 桌面应用 (React)
│   ├── web/                # Vue 3 Web 应用
│   └── api/                # Node.js API 服务
├── packages/               # 共享包
│   ├── contracts/          # 类型定义和接口
│   ├── domain-shared/      # 跨端值对象与共享领域类型
│   ├── governance/         # 规约检查与可执行治理规则
│   ├── {domain}/           # 垂直业务模块包（包内再分层）
│   ├── ui/                 # 共享 UI 组件
│   └── utils/              # 工具函数
├── common/                 # 共享业务模块
└── docs/                   # 文档
    ├── MCP-Configuration-Guide.md
    └── pnpm-MCP-Best-Practices.md
```

## 🛠️ 快速开始

### 环境要求

- Node.js 22+
- pnpm 10+ (推荐使用 pnpm 而非 npm)
- VS Code (推荐，已配置 AI 辅助开发)

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/BakerSean168/DailyUse.git
cd DailyUse

# 安装依赖 (使用 pnpm，比 npm 快 3x)
pnpm install

# 【可选】安装全局 Nx CLI（推荐，可直接使用 nx 命令而不需要 pnpm 前缀）
pnpm add -g nx
# 安装后可以直接使用：nx serve api 而不是 pnpm nx serve api
# 详见：docs/NX_USAGE_GUIDE.md#安装和配置

# 开发模式运行
pnpm nx serve api      # 启动 API 服务
pnpm nx serve web      # 启动 Web 应用
pnpm nx serve desktop  # 启动桌面应用

# 或者使用 package.json 中的快捷脚本
pnpm dev              # 启动桌面应用
pnpm dev:web          # 启动 Web 应用
pnpm dev:api          # 启动 API 服务

# 构建生产版本
pnpm build            # 构建所有应用
pnpm build:desktop    # 构建桌面应用
```

### AI 辅助开发设置

```bash
# 配置 AI 辅助开发环境
.\scripts\setup-ai-dev.ps1

# 重启 VS Code 后即可享受增强的 AI 编程体验
```

## 💡 为什么选择 pnpm？

相比 npm，pnpm 为 DailyUse 项目带来显著优势：

| 特性          | npm          | pnpm     | 提升         |
| ------------- | ------------ | -------- | ------------ |
| 安装速度      | 45s          | 15s      | **3x 更快**  |
| 磁盘占用      | 1.5GB        | 450MB    | **节省 70%** |
| Monorepo 支持 | 基础         | 原生     | **完美集成** |
| 依赖安全      | 允许幽灵依赖 | 严格管理 | **更安全**   |

详见：[pnpm + MCP 最佳实践指南](docs/pnpm-MCP-Best-Practices.md)

## 🎯 功能特性

### 已实现功能

#### 🏠 核心功能

- **用户管理**: 账户管理、数据管理
- **知识仓库**: Markdown 文档存储、资源管理、文档/图片仓库
- **待办任务**: 任务 CRUD、桌面提醒、任务归档
- **Markdown 编辑器**: 分屏编辑、实时预览、可视化 Git 集成
- **OKR 目标管理**: 目标设定与跟踪
- **智能提醒**: 提醒事项管理、弹窗通知
- **快速启动器**: Alt+Space 快捷启动、应用管理
- **应用设置**: 主题切换、国际化、编辑器配置

#### 🔧 技术特性

- **跨平台**: Windows/macOS/Linux 支持
- **离线优先**: 本地 SQLite 数据库
- **模块化**: Nx Monorepo 架构
- **类型安全**: 全栈 TypeScript
- **现代 UI**: Vuetify Material Design (Web) / shadcn/ui (Desktop)

### 🚧 开发中功能

- 学习内容推荐系统
- 社交媒体集成 (B站订阅等)
- 收藏与书签管理
- RSS 订阅支持
- 自动化脚本系统
- 知识分享平台

## 🤖 AI 辅助开发

本项目已配置 GitHub Copilot Cloud Agent + MCP 集成，提供：

- **☁️ 云端 AI 引擎**: 强大的 Cloud Agent 支持，提供更准确的代码建议
- **智能代码补全**: 基于项目上下文的精准建议
- **架构理解**: AI 深度理解 Nx Monorepo 结构
- **最佳实践**: Vue 3 + Electron + TypeScript 优化建议
- **自动重构**: 智能代码重构和优化
- **代码审查**: 自动检测 bug 和安全漏洞
- **测试生成**: 自动生成单元测试和集成测试

详细使用：[GitHub Copilot Cloud Agent 完整指南](GITHUB_COPILOT_CLOUD_AGENT_GUIDE.md) | [MCP 配置指南](docs/MCP-Configuration-Guide.md)

## 📖 开发文档

### � 部署文档

- **[部署导航中心](docs/deployment/README.md)** - 📍 所有部署相关文档的中心导航
  - **[快速开始 (5 分钟)](docs/deployment/01-quick-start.md)** - 快速部署参考
  - **[构建镜像](docs/deployment/02-build.md)** - Docker 构建详解
  - **[部署到生产](docs/deployment/03-deploy.md)** - 完整部署步骤
  - **[验证部署](docs/deployment/04-verify.md)** - 健康检查和验证
  - **[故障排除](docs/deployment/05-troubleshooting.md)** - 问题诊断和解决  - **[🎯 环境变量机制](docs/deployment/ENV_LOADING_MECHANISM.md)** - 环境变量自动加载优先级详解  - **[CORS 配置](docs/deployment/configs/CORS_CONFIGURATION.md)** - 跨域配置指南
  - **[环境变量](docs/deployment/configs/ENVIRONMENT_CONFIGURATION.md)** - 完整环境配置文档
  - **[命令参考](docs/deployment/reference/COMMAND_REFERENCE.md)** - 常用命令速查表

### 📦 Desktop App Documentation

- **[Desktop App README](apps/desktop/README.md)** - Specific guide for the Electron Desktop Application.

###  产品需求与开发规划

- **[PRD - 产品需求文档](docs/PRD-PRODUCT-REQUIREMENTS.md)** - 🎯 完整的功能需求规格说明
  - 10 个核心模块
  - 48 个基础 CRUD 功能
  - 41 个高级特性功能
  - MVP/MMP/Future 分阶段规划

- **[Epic 规划文档](docs/epic-planning.md)** - 📅 实施计划与 Sprint 规划
  - 9 个核心 Epic (对应业务模块)
  - 173 Story Points (MVP Phase)
  - 7 个 Sprint (8-10 周)
  - User Stories 拆分与依赖关系

- **[Sprint Status 追踪](docs/sprint-status.yaml)** - 📊 开发状态实时追踪
  - 9 个 Epic 状态追踪
  - 27 个 Story 状态追踪
  - 开发工作流定义 (backlog → contexted → drafted → ready-for-dev → in-progress → review → done)
  - Sprint 进度可视化

- **[Epic 技术上下文文档](docs/)** - 📐 技术设计规格说明
  - [Epic 1: Account & Authentication](docs/epic-1-context.md) - 账户与认证系统
  - [Epic 2: Goal Module](docs/epic-2-context.md) - OKR 目标管理
  - [Epic 3: Task Module](docs/epic-3-context.md) - GTD 任务管理
  - [Epic 4: Schedule Module](docs/epic-4-context.md) - 日程调度系统
  - [Epic 5: Reminder Module](docs/epic-5-context.md) - 智能提醒系统
  - [Epic 6: Notification Module](docs/epic-6-context.md) - 通知中心
  - [Epic 7: Repository Module](docs/epic-7-context.md) - 知识仓库
  - [Epic 8: Editor Module](docs/epic-8-context.md) - Markdown 编辑器
  - [Epic 9: Setting Module](docs/epic-9-context.md) - 用户设置

### 📦 包文档

- **[包文档总索引](docs/packages-index.md)** - 📑 从这里开始，查看所有包文档
- [@dailyuse/contracts](docs/packages-contracts.md) - TypeScript 类型契约层
- [@dailyuse/domain-shared](docs/packages-domain-shared.md) - 共享值对象与领域基础类型
- [@dailyuse/governance](packages/governance/README.md) - 规约治理与可执行标准
- [@dailyuse/utils](docs/packages-utils.md) - 通用工具库 (Logger, 验证, 事件总线)
- [@dailyuse/ui](docs/packages-ui.md) - Vue 3 UI 组件库 (Vuetify)
- [@dailyuse/assets](docs/packages-assets.md) - 静态资源 (图片, 音频)

### 🏗️ 架构文档

- [项目概览](docs/project-overview.md) - 项目整体介绍
- [Web 应用架构](docs/architecture-web.md) - 前端架构设计
- [API 应用架构](docs/architecture-api.md) - 后端架构设计
- [集成架构](docs/integration-architecture.md) - 跨应用集成方案

### 🛠️ Nx Monorepo 指南

- [Nx 配置完整指南](docs/NX_CONFIGURATION_GUIDE.md) - nx.json 和 project.json 详解
- [Nx 使用指南](docs/NX_USAGE_GUIDE.md) - 常用命令、优势、工作流
- [Project.json 配置说明](docs/PROJECT_JSON_GUIDE.md) - 各项目配置详解

### 🤖 AI 辅助开发

- [GitHub Copilot Cloud Agent 完整指南](GITHUB_COPILOT_CLOUD_AGENT_GUIDE.md) - 🌟 详细的 Cloud Agent 使用教程
- [MCP 配置指南](docs/MCP-Configuration-Guide.md) - AI 辅助开发设置
- [pnpm 最佳实践](docs/pnpm-MCP-Best-Practices.md) - 包管理优化
- [MCP 快速开始](docs/MCP-Quick-Start.md) - 5分钟设置指南

### 🧪 测试文档

- [Vitest Workspace 指南](VITEST_WORKSPACE_GUIDE.md) - 详细测试使用指南
- [Vitest 配置总结](VITEST_WORKSPACE_CONFIGURATION_SUMMARY.md) - 配置说明
- [Vitest 验证报告](VITEST_WORKSPACE_VERIFICATION_REPORT.md) - 配置验证

## 🔧 开发工具

### VS Code 扩展推荐

```json
{
  "recommendations": [
    "Vue.volar",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "nrwl.angular-console"
  ]
}
```

### 项目脚本

```bash
# 开发（使用 Nx 命令）
pnpm nx serve api          # 启动 API 服务
pnpm nx serve web          # 启动 Web 应用
pnpm nx serve desktop      # 启动桌面应用

# 或使用快捷脚本（定义在 package.json）
pnpm dev                   # 启动桌面应用
pnpm dev:web               # 启动 Web 应用
pnpm dev:api               # 启动 API 服务

# 构建
pnpm nx build api          # 构建 API
pnpm nx build web          # 构建 Web
pnpm nx build desktop      # 构建桌面应用
pnpm build                 # 构建所有项目（快捷脚本）

# 代码质量
pnpm nx lint api           # 检查 API 代码
pnpm nx lint web           # 检查 Web 代码
pnpm lint                  # 检查所有代码（快捷脚本）
pnpm format                # 代码格式化

# 测试 (Vitest Workspace)
pnpm nx test api           # 运行 API 测试
pnpm nx test web           # 运行 Web 测试
pnpm test                  # 运行所有测试
pnpm test:ui               # UI 模式测试
pnpm test:coverage         # 覆盖率报告
# 更多测试命令见 VITEST_WORKSPACE_GUIDE.md

# Nx 高级功能
pnpm nx graph              # 查看项目依赖图（交互式）
pnpm nx affected:test      # 只测试受 Git 变更影响的项目
pnpm nx affected:build     # 只构建受影响的项目
pnpm nx affected:lint      # 只检查受影响的项目

# 并行执行多个项目
pnpm nx run-many --target=build --all      # 并行构建所有项目
pnpm nx run-many --target=test --all       # 并行测试所有项目

# 查看 Nx 缓存状态
pnpm nx reset              # 清除 Nx 缓存
```

**💡 提示**：

- 安装全局 Nx CLI 后可省略 `pnpm` 前缀：`nx serve api`
- 详细命令说明见：[Nx 使用指南](docs/NX_USAGE_GUIDE.md)
- 配置说明见：[Nx 配置完整指南](docs/NX_CONFIGURATION_GUIDE.md)

## 🏗️ 架构设计

### 领域驱动设计 (DDD)

```
Domain Package ({domain})       # 业务模块包（垂直切分）
├── Application Layer          # 应用服务和用例
├── Infrastructure Layer       # 数据访问和外部服务
└── Presentation Layer         # UI 组件和控制器
```

### 跨应用代码共享

```typescript
// 类型共享
import { Task, User } from '@dailyuse/contracts';

// 共享领域类型
import { TaskId } from '@dailyuse/domain-shared/task';

// 垂直模块包中的业务逻辑
import { TaskService } from '@dailyuse/task';

// UI 组件共享
import { Button, Dialog } from '@dailyuse/ui';
```

## 🚀 性能优化

- **构建缓存**: Nx 增量构建，只构建变更部分
- **包管理**: pnpm 符号链接，节省磁盘空间
- **代码分割**: Vite 动态导入，按需加载
- **类型检查**: 增量 TypeScript 编译

## 📊 项目统计

```bash
# 代码统计
pnpm cloc src --exclude-dir=node_modules

# 依赖分析
pnpm nx dep-graph

# 包大小分析
pnpm nx bundle-analyzer
```

## 🤝 贡献指南

本项目使用 **Git Flow 工作流**进行开发。

### 开发流程

1. Fork 项目
2. 从 `dev` 分支创建特性分支
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature
   ```
3. 开发并提交更改（遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)）
   ```bash
   git commit -m "feat: add some amazing feature"
   ```
4. 推送到你的 Fork
   ```bash
   git push origin feature/your-feature
   ```
5. 创建 Pull Request 到 `dev` 分支（不是 `main`）
6. 等待代码审查和合并

### 📖 详细文档

- **完整工作流**: [Git Flow 工作流文档](.github/GITFLOW.md)
- **快速参考**: [Git Flow 快速参考](.github/GITFLOW_QUICK_REFERENCE.md)
- **提交规范**: [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)

### 分支说明

- `main`: 生产环境代码（稳定版本）
- `dev`: 开发环境代码（最新功能）
- `feature/*`: 功能开发分支
- `bugfix/*`: Bug 修复分支
- `hotfix/*`: 紧急修复分支

### 提交信息规范

```bash
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具变动
```

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 作者

- **BakerSean168** - _项目创建者_ - [GitHub](https://github.com/BakerSean168)

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Nx](https://nx.dev/) - 智能构建系统
- [pnpm](https://pnpm.io/) - 快速、节省磁盘空间的包管理器
- [Vuetify](https://vuetifyjs.com/) - Vue Material 组件框架

---

## 🚀 Quick Start with GitHub Codespaces

想要一个**开箱即用**的开发环境？使用 Codespaces！

### 方式 1: GitHub Codespaces (推荐) ⭐

1. 点击仓库页面的 **Code** 按钮
2. 选择 **Codespaces** 标签
3. 点击 **New codespace**
4. 等待 3-5 分钟自动配置完成

**包含内容**:

- ✅ Node.js 22.20.0 + pnpm 10.18.3
- ✅ Docker + Git + GitHub CLI
- ✅ 所有 VS Code 扩展（Copilot, Nx Console, Vue Volar...）
- ✅ MCP 工具集成（nx-mcp-server, playwright-mcp, chrome-devtools）
- ✅ 自动安装依赖
- ✅ 端口自动转发

详细文档: [.devcontainer/README.md](.devcontainer/README.md)

### 方式 2: 本地 Dev Container

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. 安装 VS Code [Dev Containers 扩展](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. 克隆仓库
4. 在 VS Code 中打开，按 `F1`
5. 运行 **Dev Containers: Reopen in Container**

### 快速命令

```bash
# 启动 API 服务器
pnpm exec nx run api:dev

# 启动 Web 前端
pnpm exec nx run web:dev

# 查看项目依赖图
pnpm exec nx graph
```

更多信息: [Codespaces 快速入门](.devcontainer/QUICKSTART.md)
