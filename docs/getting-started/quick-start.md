---
tags:
  - getting-started
  - quick-start
  - tutorial
description: 5分钟快速启动Memoflow项目
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# ⚡ Quick Start Guide

> 从零到运行，只需 5 分钟！

## 前置要求

- **Node.js** >= 22.20.0
- **pnpm** >= 10.18.0
- **Git**

## 🚀 快速开始

### 1. 克隆项目（30秒）

```bash
git clone https://github.com/BakerSean168/dailyuse.git
cd dailyuse
```

### 2. 安装依赖（2分钟）

```bash
# 安装 pnpm（如果还没有）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 启动开发环境（1分钟）

```bash
# 启动 API 服务器
pnpm nx serve api

# 新开一个终端，启动 Web 应用
pnpm nx serve web

# 或者启动桌面应用
pnpm nx serve desktop
```

### 4. 验证运行（30秒）

打开浏览器访问：
- **Web 应用**: http://localhost:3000
- **API 服务**: http://localhost:3888

看到登录页面？**恭喜！你已经成功了！** 🎉

## 📚 下一步

现在你已经成功运行了项目，接下来可以：

1. 📖 [[installation|详细安装指南]] - 了解更多配置选项
2. 🏗️ [[project-structure|项目结构导览]] - 了解代码组织方式
3. 🛠️ [[../architecture/system-overview|系统架构]] - 深入理解系统设计
4. 💻 [[first-contribution|第一次贡献]] - 开始你的第一个功能

## 🐛 遇到问题？

### 常见问题

**问题 1: pnpm 安装失败**
```bash
# 清理缓存重试
pnpm store prune
pnpm install --force
```

**问题 2: 端口被占用**
```bash
# 查看占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :3888

# 修改端口（在 nx.json 中）
```

**问题 3: Node 版本不对**
```bash
# 使用 nvm 切换版本
nvm install 22.20.0
nvm use 22.20.0
```

更多问题？查看 [[../guides/troubleshooting/common-errors|常见错误排查]]

## 💡 Tips

- 使用 `pnpm nx graph` 查看项目依赖关系图
- 使用 `pnpm nx run-many --target=test --all` 运行所有测试
- 添加 `--skip-nx-cache` 跳过缓存进行干净构建

## 🎯 快捷命令

```bash
# 开发
pnpm dev              # 启动桌面应用
pnpm dev:web          # 启动 Web 应用
pnpm dev:api          # 启动 API 服务

# 构建
pnpm build            # 构建所有项目
pnpm build:desktop    # 构建桌面应用

# 测试
pnpm test             # 运行所有测试
pnpm test:ui          # UI 模式测试

# 代码质量
pnpm lint             # 检查代码
pnpm format           # 格式化代码
```

---

**完成时间**: ~5 分钟  
**难度**: ⭐ 简单

准备好深入了解了吗？继续阅读 [[installation|详细安装指南]]！


