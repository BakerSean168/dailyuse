# Memoflow - 智能个人效率管理平台

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
dailyuse/                    # 根目录
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


