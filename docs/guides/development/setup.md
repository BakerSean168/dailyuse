---
tags:
  - guide
  - development
  - setup
  - environment
  - tools
description: 开发环境完整配置指南 - IDE、工具、Prettier、ESLint配置
created: 2025-11-23T15:00:00
updated: 2025-01-22T00:00:00
---

# 🛠 开发环境配置

配置高效的 Memoflow 开发环境，包括编辑器、工具和插件。

> **关联标准**: 🏷️ [standards/naming.md](../../standards/naming.md) | 📐 [standards/tech-stack.md](../../standards/tech-stack.md)

---

## 💻 IDE 配置

### VS Code (推荐)

#### 必需扩展

| 扩展                      | 用途           | 安装                               |
| ------------------------- | -------------- | ---------------------------------- |
| **Volar**                 | Vue 3 语言支持 | `Vue.volar`                        |
| **TypeScript Vue Plugin** | Vue TS 支持    | `Vue.vscode-typescript-vue-plugin` |
| **ESLint**                | 代码检查       | `dbaeumer.vscode-eslint`           |
| **Prettier**              | 代码格式化     | `esbenp.prettier-vscode`           |
| **Nx Console**            | Nx 可视化工具  | `nrwl.angular-console`             |

#### 推荐扩展

| 扩展                   | 用途            |
| ---------------------- | --------------- |
| **Prisma**             | Prisma 语法高亮 |
| **GitLens**            | Git 增强        |
| **Error Lens**         | 错误实时显示    |
| **Better Comments**    | 注释增强        |
| **Todo Tree**          | TODO 标记       |
| **Code Spell Checker** | 拼写检查        |

#### 一键安装扩展

```bash
# 安装所有推荐扩展
code --install-extension Vue.volar
code --install-extension Vue.vscode-typescript-vue-plugin
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension nrwl.angular-console
code --install-extension Prisma.prisma
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
```

#### Workspace 配置

创建 `.vscode/settings.json`:

```json
{
  // 编辑器设置
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,

  // TypeScript 设置
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Vue 设置
  "vue.server.hybridMode": true,

  // ESLint 设置
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact", "vue"],

  // 文件关联
  "files.associations": {
    "*.css": "css",
    "*.vue": "vue"
  },

  // 排除文件
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  },

  // 搜索排除
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true,
    "**/pnpm-lock.yaml": true
  }
}
```

创建 `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "vue.volar",
    "vue.vscode-typescript-vue-plugin",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "nrwl.angular-console",
    "prisma.prisma",
    "eamodio.gitlens",
    "usernamehw.errorlens"
  ]
}
```

#### 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "serve", "api"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/web"
    },
    {
      "name": "Attach to API",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### WebStorm / IntelliJ IDEA

#### 配置步骤

1. **安装插件**
   - Settings → Plugins → 搜索并安装 "Vue.js"

2. **配置 TypeScript**
   - Settings → Languages & Frameworks → TypeScript
   - TypeScript: 选择项目的 TypeScript 版本
   - 启用 "TypeScript Language Service"

3. **配置 ESLint**
   - Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - 选择 "Automatic ESLint configuration"

4. **配置 Prettier**
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - Prettier package: `node_modules/prettier`
   - 启用 "On save"

---

## 🔧 Git 配置

### Git Hooks (Husky)

项目已配置 Husky，在提交时自动运行检查。

```bash
# pre-commit: 运行 lint-staged
# commit-msg: 检查提交信息格式
```

### Git 配置

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认分支名
git config --global init.defaultBranch main

# 设置换行符处理（Windows）
git config --global core.autocrlf true

# 设置换行符处理（Mac/Linux）
git config --global core.autocrlf input

# 启用颜色输出
git config --global color.ui auto
```

### Git Aliases

```bash
# 添加常用别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

---

## 🗄️ 数据库工具

### Prisma Studio

可视化数据库管理工具。

```bash
# 启动 Prisma Studio
pnpm nx run api:prisma-studio

# 访问 http://localhost:5555
```

### DBeaver (推荐)

强大的数据库管理工具，支持 PostgreSQL。

**下载**: https://dbeaver.io/

**连接配置**:

```
Host: localhost
Port: 5432
Database: Memoflow
Username: Memoflow
Password: dev123456
```

### pgAdmin

PostgreSQL 官方管理工具。

**下载**: https://www.pgadmin.org/

---

## 📊 API 测试工具

### Postman (推荐)

**下载**: https://www.postman.com/

**导入集合**:

```bash
# 项目根目录
tools/postman/memoflow.postman_collection.json
```

### Insomnia

**下载**: https://insomnia.rest/

### REST Client (VS Code)

安装 `REST Client` 扩展，在项目中创建 `.http` 文件。

```http
### 登录
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### 获取目标列表
GET http://localhost:3000/goals
Authorization: Bearer {{token}}
```

---

## 🐳 Docker Desktop

### 安装

**Windows/Mac**: https://www.docker.com/products/docker-desktop

**Linux**:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 验证安装

```bash
docker --version
docker-compose --version
```

### 启动服务

```bash
# 启动数据库和 Redis
docker-compose up -d postgres redis

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🧪 测试工具

### Vitest UI

可视化测试界面。

```bash
# 启动测试 UI
pnpm nx test api --ui

# 访问 http://localhost:51204/__vitest__/
```

### Playwright Test Explorer

VS Code 扩展，用于运行和调试 E2E 测试。

```bash
# 安装扩展
code --install-extension ms-playwright.playwright
```

---

## 📦 包管理器优化

### pnpm 配置

创建 `.npmrc`:

```ini
# 使用淘宝镜像（国内）
registry=https://registry.npmmirror.com

# 或使用官方源
# registry=https://registry.npmjs.org

# pnpm 配置
shamefully-hoist=true
strict-peer-dependencies=false
```

### 清理缓存

```bash
# 清理 pnpm 缓存
pnpm store prune

# 清理 Nx 缓存
pnpm nx reset

# 清理 node_modules
rm -rf node_modules
pnpm install
```

---

## 🚀 性能优化

### TypeScript 性能

在 `tsconfig.json` 中优化：

```json
{
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true
  }
}
```

### VS Code 性能

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.nx/**": true
  },
  "typescript.disableAutomaticTypeAcquisition": true
}
```

---

## 🔍 调试技巧

### Chrome DevTools

1. **打开 DevTools**: F12 或 Ctrl+Shift+I
2. **Vue DevTools**: 安装浏览器扩展
3. **网络面板**: 查看 API 请求
4. **控制台**: 查看日志

### Node.js 调试

```bash
# 启动调试模式
node --inspect-brk dist/apps/api/main.js

# 或使用 VS Code 调试配置
```

### Prisma 调试

```bash
# 启用查询日志
DATABASE_URL="postgresql://...?schema=public&connection_limit=5&query_logging=true"
```

---

## 📚 浏览器扩展

| 扩展                      | 用途                                  |
| ------------------------- | ------------------------------------- |
| **Vue DevTools**          | Vue 组件调试                          |
| **Redux DevTools**        | 状态管理调试（如使用 Pinia DevTools） |
| **JSON Viewer**           | JSON 格式化                           |
| **React Developer Tools** | React 调试（Desktop 应用）            |

---

## 🎓 学习资源

### 官方文档

- [Nx Documentation](https://nx.dev/)
- [Vue 3 Guide](https://vuejs.org/guide/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)

### 项目文档

- [[coding-standards|代码规范]]
- [[testing|测试指南]]
- [[debugging|调试指南]]
- [[git-workflow|Git 工作流]]

---

## 🆘 常见问题

### VS Code 找不到模块

```bash
# 重启 TypeScript 服务器
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### ESLint 不工作

```bash
# 检查 ESLint 输出
Ctrl+Shift+P → "ESLint: Show Output Channel"

# 重启 ESLint
Ctrl+Shift+P → "ESLint: Restart ESLint Server"
```

### Volar 接管模式

VS Code 设置中禁用内置 TypeScript 扩展：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## ✅ 验证配置

运行以下命令验证环境配置：

```bash
# 检查 Node.js 版本
node --version  # 应该是 v22.x.x

# 检查 pnpm 版本
pnpm --version  # 应该是 9.x.x

# 检查 Git 版本
git --version

# 检查 Docker 版本
docker --version

# 运行项目
pnpm install
pnpm nx serve api
pnpm nx serve web
```

---

## 📞 需要帮助？

- [[../../contributing/README|贡献指南]]
- [[../troubleshooting/common-errors|常见错误]]
- [GitHub Discussions](https://github.com/BakerSean168/dailyuse/discussions)

---

**提示**: 配置完成后，建议创建一个新分支并尝试提交代码，验证 Git Hooks 是否正常工作。


