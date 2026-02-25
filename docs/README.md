---
tags:
  - documentation
  - index
  - obsidian
description: DailyUse项目文档中心 v2.0 - 生产级文档系�?
created: 2025-11-23T14:54:12
updated: 2025-01-22T00:00:00
---

# 📚 DailyUse Documentation v2.0

> 🎯 生产级、开发友好、AI优化的文档系�?
>
> **最后扫�?\*: 2025-12-16 | **版本**: 0.2.x | **架构**: Nx Monorepo + DDD | **包数�?\*: 16

## 🚀 快速导�?

<table>
<tr>
<td width="33%">

### 🌱 新手入门

开始使�?DailyUse

- [�?5分钟快速开始](./getting-started/quick-start.md)
- [📦 完整安装指南](./getting-started/installation.md)
- [📁 项目结构导览](./getting-started/project-structure.md)
- [�?开发指南](./development-instructions.md)

</td>
<td width="33%">

### 🏗 架构设计

了解系统架构

- [🎯 系统架构概览](./architecture/system-overview.md)
- [🔌 API架构](./architecture/api-architecture.md)
- [🌐 Web架构](./architecture/web-architecture.md)
- [🖥�?Desktop架构](./architecture/desktop-architecture.md)
- [📝 架构决策记录 (ADR)](./architecture/adr/README.md)

</td>
<td width="33%">

### 📐 规范与最佳实�?

遵循项目标准

- [📋 规范速查表](#-规范最佳实�?速查)
- [🏛 架构规范](./standards/architecture.md)
- [📝 代码规范](./guides/development/coding-standards.md)
- [🏷�?命名规范](./standards/naming.md)
- [📂 目录结构](./standards/structure.md)

</td>
</tr>
<tr>
<td width="33%">

### 📖 开发工作流�?

日常开发指�?

- [🛠 开发环境配置](./guides/development/setup.md)
- [🌿 Git工作流](./guides/development/git-workflow.md)
- [🧪 测试指南](./guides/development/testing.md)
- [🐛 调试指南](./guides/development/debugging.md)

</td>
<td width="33%">

### 📦 业务模块

深入各个模块

- [🎯 目标管理 (OKR)](./modules/goal/README.md)
- [�?任务管理 (GTD)](./modules/task/README.md)
- [📅 日程调度](./modules/schedule/README.md)
- [�?智能提醒](./modules/reminder/README.md)
- [🤖 AI 智能助手](./modules/ai/README.md)
- [📚 知识库](./modules/repository/README.md)
- [🏛 治理规则](./modules/governance/user-guide.md)

</td>
<td width="33%">

### 📚 参考文�?

快速查�?

- [🔌 API参考](./reference/api/README.md)
- [⚙️ 配置参考](./reference/configuration/README.md)
- [📦 包文档索引](./packages-index.md)
- [🗄�?数据模型](./data-models.md)
- [📂 源码树分析](./source-tree-analysis.md)

</td>
</tr>
</table>

---

## 📖 文档体系结构

```
docs/
├── getting-started/         # 🌱 新手入门（快速开始、安装、结构）
├── architecture/            # 🏗 系统架构（C4模型、DDD、ADR�?
�?  └── adr/                # 架构决策记录
├── modules/                 # 📦 业务模块（goal、task、schedule等）
�?
├── standards/              # 📐 规范与架构标准（系统规则�?
�?  ├── index.md            # 📋 规范索引
�?  ├── architecture.md     # 🏛 架构规范（分层、DDD�?
�?  ├── naming.md           # 🏷�?命名规范
�?  ├── structure.md        # 📂 目录结构规范
�?  ├── patterns.md         # 🔄 代码模式与最佳实�?
�?  ├── contracts-structure.md  # 📦 Contracts包结�?
�?  └── tech-stack.md       # 🛠�?技术栈约束
�?
├── guides/                 # 📖 开发指南与工作流程
�?  ├── development/        # 💻 开发工作流�?
�?  �?  ├── setup.md        # 🛠 环境配置
�?  �?  ├── coding-standards.md  # 📝 编码规范（TS、Vue、NestJS�?
�?  �?  ├── git-workflow.md # 🌿 Git工作�?
�?  �?  ├── testing.md      # 🧪 测试指南
�?  �?  └── debugging.md    # 🐛 调试指南
�?  ├── deployment/         # 🚀 部署指南（环境、CI/CD�?
�?  └── troubleshooting/    # 🔧 故障排除
�?
├── reference/              # 📚 参考文�?
�?  ├── api/                # API文档（自动生成）
�?  ├── cli/                # CLI命令
�?  └── configuration/      # 配置参�?
├── examples/               # 💡 示例代码（可运行�?
├── contributing/           # 🤝 贡献指南
├── governance/             # 🏛 Governance 活文档（模式索引与模式笔记）
├── concepts/               # 💭 概念文档（DDD、事件驱动）
├── packages/               # 📦 包文档（共享包说明）
├── ops/                    # 🔧 运维文档（Docker、部署）
├── configs/                # ⚙️ 配置说明（Nx、TS、构建）
└── archives/               # 🗄�?归档文档
    ├── incidents/          # 历史问题修复
    └── legacy/             # 遗留文档
```

**规范目录说明**:

- **`standards/`** = 项目�?系统规则�? �?架构原则、设计标准、约束条�?
- **`guides/development/`** = 开发者的"操作指南" �?如何遵循规范的具体步�?

---

## 🎯 按角色导�?

### 👨‍�?新开发�?

**目标**: 快速上手开�?

1. [�?5分钟快速开始](./getting-started/quick-start.md) - 启动第一个服�?
2. [📦 完整安装指南](./getting-started/installation.md) - 配置开发环�?
3. [🛠�?开发指南](./development-instructions.md) - 开发规范与命令
4. [📁 项目结构](./getting-started/project-structure.md) - 了解代码组织
5. [🎯 系统架构](./architecture/system-overview.md) - 理解整体设计
6. [📝 代码规范](./guides/development/coding-standards.md) - 编码标准

**预计时间**: 2-3小时

### 🏗 架构�?

**目标**: 理解架构设计与决�?

1. [🎯 系统架构概览](./architecture/system-overview.md) - C4模型、DDD分层
2. [🏛 架构规范](./standards/architecture.md) - 分层、依赖关系、Clean Architecture
3. [📂 源码树分析](./source-tree-analysis.md) - 完整目录结构
4. [🗄�?数据模型](./data-models.md) - Prisma Schema 文档
5. [📝 架构决策记录](./architecture/adr/README.md) - 关键技术选型
6. [🏛 DDD模式](ddd-patterns.md) - 领域驱动设计

### 💻 高级开发�?

**目标**: 贡献高质量代�?

1. [📝 代码规范](./guides/development/coding-standards.md) - 编码标准
2. [🏷�?命名规范](./standards/naming.md) - 文件、类、变量命�?
3. [🔄 代码模式](./standards/patterns.md) - 设计模式、最佳实�?
4. [🌿 Git工作流](./guides/development/git-workflow.md) - 分支策略、提交规�?
5. [🧪 测试指南](./guides/development/testing.md) - 单元测试、E2E测试
6. [🏛 架构规范](./standards/architecture.md) - 分层原则

### 🚀 运维工程�?

**目标**: 部署与维护系�?

1. [🐳 Docker服务指南](./ops/docker/DOCKER_SERVICES_GUIDE.md) - 容器化部�?
2. [🚀 部署指南](./guides/deployment/README.md) - 各环境部署流�?
3. [🔧 故障排除](./guides/troubleshooting/README.md) - 常见问题解决
4. [⚙️ 配置参考](./reference/configuration/README.md) - 环境变量与配�?

### 📝 技术写作�?

**目标**: 编写与维护文�?

1. [📝 文档规范](./contributing/documentation-guide.md) - 写作指南
2. [📝 ADR模板](./architecture/adr/README.md) - 决策记录格式
3. [📚 学习路径](./getting-started/README.md) - 文档组织结构
4. [🤝 贡献指南](./contributing/README.md) - 协作流程

---

## �?规范与最佳实�?

这一部分是项目的"系统规则�?，所有开发者必须遵循�?

### 🚀 规范速查�?

| 我需�?..               | 查看这个文档                                            |
| ---------------------- | ------------------------------------------------------- |
| **了解架构分层规则**   | [🏛 架构规范](./standards/architecture.md)              |
| **学习编码规范**       | [📝 代码规范](./guides/development/coding-standards.md) |
| **命名变量/函数/文件** | [🏷�?命名规范](./standards/naming.md)                   |
| **理解目录结构**       | [📂 目录结构](./standards/structure.md)                 |
| **学习设计模式**       | [🔄 代码模式](./standards/patterns.md)                  |
| \*_组织Contracts�?_    | [📦 Contracts结构](./standards/contracts-structure.md)  |
| **了解技术栈约束**     | [🛠�?技术栈](./standards/tech-stack.md)                 |
| **学习Git规范**        | [🌿 Git工作流](./guides/development/git-workflow.md)    |

### 📋 核心规范�?

#### 系统架构规范 (`standards/`)

项目的基础规则 - **必读**

- **[🏛 架构规范](./standards/architecture.md)** - 分层架构、DDD原则、依赖关�?
- **[🏷�?命名规范](./standards/naming.md)** - 文件、类、变量、文件夹命名约定
- **[📂 目录结构](./standards/structure.md)** - 单体结构、包组织、层级关�?
- **[🔄 代码模式](./standards/patterns.md)** - 推荐模式、反模式、代码示�?
- **[📦 Contracts结构](./standards/contracts-structure.md)** - 类型契约层的组织
- **[🛠�?技术栈](./standards/tech-stack.md)** - 允许的库、版本约束、使用限�?

#### 开发工作流�?(`guides/development/`)

具体执行规范的步�?

- **[📝 代码规范](./guides/development/coding-standards.md)** - TypeScript、Vue 3、Express 编码规范
- **[🌿 Git工作流](./guides/development/git-workflow.md)** - 分支策略、提交规范、PR流程
- **[🧪 测试指南](./guides/development/testing.md)** - 单元测试、集成测试、E2E测试
- **[🛠 环境配置](./guides/development/setup.md)** - IDE设置、工具安装、环保变�?
- **[🐛 调试指南](./guides/development/debugging.md)** - 调试技巧、常见问题排�?

---

## 📝 架构文档 (Architecture)

完整的共享包文档，包含API参考和使用示例�?

| 包名                         | 描述                 | 文档                                 |
| ---------------------------- | -------------------- | ------------------------------------ |
| `@dailyuse/contracts`        | TypeScript类型契约�? | [[packages-contracts\|查看文档]]     |
| `@dailyuse/domain-shared`    | 共享领域基础类型     | [[packages-domain-shared\|查看文档]] |
| `@dailyuse/{domain}`         | 垂直业务模块包       | -                                    |
| `@dailyuse/governance`       | 规约治理与执行检查   | -                                    |
| `@dailyuse/application-*`    | 应用服务�?           | -                                    |
| `@dailyuse/infrastructure-*` | 基础设施�?           | -                                    |
| `@dailyuse/ui-vue`           | Vue 3 组件           | -                                    |
| `@dailyuse/ui-vuetify`       | Vuetify 3 组件       | -                                    |
| `@dailyuse/ui-react`         | React Hooks          | -                                    |
| `@dailyuse/ui-react-shadcn`  | shadcn/ui 组件       | -                                    |
| `@dailyuse/utils`            | 通用工具�?           | [[packages-utils\|查看文档]]         |
| `@dailyuse/assets`           | 静态资�?             | -                                    |
| `@dailyuse/test-utils`       | 测试工具             | -                                    |

📑 [[packages-index|包文档完整索�?(16个包)]]

---

## 🏗 架构文档 (Architecture)

### 核心架构

- [[architecture/system-overview|🎯 系统架构概览]] - C4模型、技术栈、模块划�?
- [[architecture/api-architecture|🔌 API架构]] - Express后端架构
- [[architecture/web-architecture|🌐 Web架构]] - Vue 3前端架构
- [[architecture/integration-architecture|🔗 集成架构]] - 跨应用集成方�?

### 架构决策记录 (ADR)

记录项目中重要的架构决策及其背景�?

- [[architecture/adr/README|📝 ADR索引]] - 所有架构决�?
- [[architecture/adr/001-use-nx-monorepo|ADR-001: 使用Nx Monorepo]]
- [[architecture/adr/002-ddd-pattern|ADR-002: 采用DDD架构模式]]
- [[architecture/adr/003-event-driven-architecture|ADR-003: 事件驱动架构]]

---

## 💡 概念文档 (Concepts)

深入理解核心概念和设计模式�?

### DDD与架构模�?

- [[ddd-patterns|🏛 DDD模式指南]] - Entity、Value Object、Aggregate、Repository、Service
- [[concepts/event-driven|📡 事件驱动架构]] - 事件设计、发布订阅模�?

### 业务概念

#### 权重系统

- [[concepts/weight-system/WEIGHT_SYSTEM_COMPLETE_OVERHAUL|权重系统完整重构]] - 系统设计与实�?
- [[concepts/weight-system/WEIGHT_SYSTEM_QUICK_REFERENCE|权重系统快速参考]] - API速查

#### 日程调度系统

- [[concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM|统一日程事件系统]] - 系统架构设计
- [[concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM_QUICK_GUIDE|日程事件系统快速指南]] - 快速上�?

---

## 📖 开发指�?(Guides)

所有规范的具体实践操作指南 - 参见 [📐 规范与最佳实践](#-规范与最佳实�? 章节获取完整规范链接�?

### 开发工作流�?

- [🛠 开发环境配置](./guides/development/setup.md) - IDE、工具、插件配�?
- [🌿 Git工作流](./guides/development/git-workflow.md) - 分支策略、提交规范、代码审�?
- [🧪 测试指南](./guides/development/testing.md) - 如何编写和运行测�?
- [🐛 调试指南](./guides/development/debugging.md) - 调试技巧和常见问题排查

### 部署指南

- [🖥 本地部署](./guides/deployment/local.md) - 开发环境部�?
- [🎭 预发布环境](./guides/deployment/staging.md) - Staging部署流程
- [🚀 生产环境](./guides/deployment/production.md) - Production部署流程

### 故障排除

- [�?常见错误](./guides/troubleshooting/common-errors.md) - 常见问题解决方案
- [�?性能问题](./guides/troubleshooting/performance.md) - 性能优化与排�?

---

## 📚 参考文�?(Reference)

### API参�?

- [[reference/api/README|🔌 API参考]] - RESTful API文档
- [[reference/api/authentication|🔐 认证API]] - 登录、注册、Token
- [[reference/api/goal|🎯 目标API]] - 目标CRUD操作
- [[reference/api/task|�?任务API]] - 任务管理
- [[reference/api/schedule|📅 日程API]] - 日程调度

### CLI参�?

- [[reference/cli/README|⌨️ CLI命令]] - 命令行工�?
- [[reference/cli/nx|�?Nx命令]] - Nx任务执行
- [[reference/cli/prisma|🗄�?Prisma命令]] - 数据库迁�?

### 配置参�?

- [[reference/configuration/README|⚙️ 配置参考]] - 配置文件说明
- [[reference/configuration/nx|⚙️ Nx配置]] - nx.json、project.json
- [[reference/configuration/typescript|⚙️ TypeScript配置]] - tsconfig.json
- [[reference/configuration/env-variables|🔑 环境变量]] - .env配置

---

## 💡 示例代码 (Examples)

可运行的示例代码，帮助理解API使用�?

- [[examples/README|💡 示例索引]] - 所有示例列�?
- [[examples/goal/|🎯 目标示例]] - 创建、更新、删除目�?
- [[examples/task/|�?任务示例]] - 任务操作示例
- [[examples/schedule/|📅 日程示例]] - 日程调度示例

---

## 🤝 贡献指南 (Contributing)

参与项目开发的完整指南�?

- [🤝 贡献指南](./contributing/README.md) - 如何贡献代码
- [📜 行为准则](./contributing/code-of-conduct.md) - 社区行为规范
- [🔀 PR模板](./contributing/pull-request-template.md) - Pull Request指南
- [📝 文档规范](./contributing/documentation-guide.md) - 文档写作指南

### 贡献者规范检查清�?

贡献代码前，请确保：

- �?阅读 [📝 代码规范](./guides/development/coding-standards.md)
- �?遵循 [🏷�?命名规范](./standards/naming.md)
- �?了解 [🏛 架构规范](./standards/architecture.md)
- �?遵循 [🌿 Git工作流](./guides/development/git-workflow.md)
- �?编写 [🧪 相应的测试](./guides/development/testing.md)

---

## 🔧 运维文档 (Operations)

### Docker配置

- [[ops/docker/DOCKER_CONFIG_UNIFIED|🐳 Docker配置统一说明]] - 完整的Docker配置指南
- [[ops/docker/DOCKER_SERVICES_GUIDE|🐳 Docker服务指南]] - 服务启动与管�?

---

## 📦 业务模块 (Modules)

每个业务模块的详细文档�?

| 模块               | 描述           | 文档                            |
| ------------------ | -------------- | ------------------------------- | ---------- |
| **Goal**           | OKR目标管理    | [[modules/goal/README           | 查看文档]] |
| **Task**           | GTD任务管理    | [[modules/task/README           | 查看文档]] |
| **Schedule**       | 日程调度系统   | [[modules/schedule/README       | 查看文档]] |
| **Reminder**       | 智能提醒系统   | [[modules/reminder/README       | 查看文档]] |
| **Notification**   | 通知中心       | [[modules/notification/README   | 查看文档]] |
| **Repository**     | 知识仓库       | [[modules/repository/README     | 查看文档]] |
| **Editor**         | Markdown编辑�? | [[modules/editor/README         | 查看文档]] |
| **Authentication** | 认证授权       | [[modules/authentication/README | 查看文档]] |

---

## ⚙️ 配置说明 (Configs)

构建工具和开发工具的配置说明�?

### Nx配置

- [[configs/nx-configuration|�?Nx配置说明]]
- [[configs/nx-optimization|�?Nx优化指南]]

### TypeScript配置

- [[configs/typescript-configuration|📘 TypeScript配置说明]]
- [[configs/tsconfig-paths|📘 路径映射配置]]

### 构建优化

- [[how-to/build/NX_VS_TSC_INCREMENTAL_BUILD|⚙️ Nx vs tsc增量构建]]
- [[how-to/build/TSUP_MIGRATION_COMPLETE|⚙️ tsup迁移完成]]

---

## 🗄�?归档文档 (Archives)

历史文档，供参考�?

### 问题修复报告

- [[archives/incidents/BUILD_ISSUE_REPORT|🔧 构建问题报告]]
- [[archives/incidents/COMPILATION_ERROR_FIX_SUMMARY|🔧 编译错误修复总结]]
- [[archives/incidents/E2E_TEST_FIX_REPORT|🔧 E2E测试修复报告]]

### 遗留文档

- [[archives/legacy/README|🗄�?遗留文档索引]] - 18篇历史实现文�?

---

## 📊 文档统计

| 类别                                | 数量        | 状�?      |
| ----------------------------------- | ----------- | --------- |
| **入门指南**                        | 4�?         | �?完成    |
| \*_规范�?_ (standards)              | 7�?         | �?完成    |
| **开发工作流** (guides/development) | 5�?         | �?完成    |
| **架构文档**                        | 5�?+ 3个ADR | �?完成    |
| **业务模块**                        | 8个模�?     | 🔄 进行�? |
| **部署指南** (guides/deployment)    | 3+�?        | 🔄 进行�? |
| \*_参考文�?_                        | 15+�?       | 🔄 进行�? |
| **贡献指南**                        | 4�?         | �?完成    |
| \*_包文�?_                          | 6�?         | �?完成    |
| **概念文档**                        | 8�?         | �?完成    |
| **运维文档**                        | 2�?         | �?完成    |
| **配置说明**                        | 8�?         | �?完成    |
| **归档文档**                        | 21�?        | �?完成    |

**文档总数**: 110+ 篇（包含规划中）  
**v2.0完成�?\*: 45% ⬆️  
**规范完成�?\*: 100% �?

---

## 💡 文档约定

### YAML Front Matter

所有文档使用Obsidian兼容的YAML前置元数据：

```yaml
---
tags:
  - tag1
  - tag2
description: 文档简短描�?
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---
```

### 链接格式

- **内部链接**: `[[文件名|显示文本]]` �?`[[文件名]]`
- **外部链接**: `[显示文本](URL)`
- **相对路径**: `[文本](./相对路径.md)`

### 文档状态标�?

- �?**完成** - 文档内容完整且最�?
- 🔄 \*_进行�?_ - 文档正在编写或更�?
- �?\*_待创�?_ - 文档计划中但尚未创建
- 🗄�?\*_已归�?_ - 历史文档，仅供参�?

---

## 🔍 搜索技�?

### Obsidian搜索

在Obsidian中打开 `docs/` 目录，使用以下搜索技巧：

- \*_按标签搜�?_: `tag:#getting-started`
- **按文件名搜索**: `file:quick-start`
- **全文搜索**: 直接输入关键�?
- **组合搜索**: `tag:#api path:reference/`

### IDE搜索

在VS Code中：

- **Ctrl+P**: 快速打开文件
- **Ctrl+Shift+F**: 全局搜索
- **Ctrl+T**: 搜索符号

---

## 🔗 外部资源

### 技术栈文档

| 技�?           | 官方文档                                              |
| -------------- | ----------------------------------------------------- |
| **Nx**         | [nx.dev](https://nx.dev/)                             |
| **Vue 3**      | [vuejs.org](https://vuejs.org/)                       |
| **Express**    | [expressjs.com](https://expressjs.com/)               |
| **TypeScript** | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Prisma**     | [prisma.io](https://www.prisma.io/)                   |
| **Vuetify**    | [vuetifyjs.com](https://vuetifyjs.com/)               |

### 设计资源

- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [Vuetify Icon Fonts](https://vuetifyjs.com/en/features/icon-fonts/)

---

## 🤝 参与文档建设

### 报告文档问题

发现文档错误或缺失？

1. �?[GitHub Issues](https://github.com/BakerSean168/DailyUse/issues) 创建问题
2. 使用标签 `documentation`
3. 描述问题位置和期望内�?

### 贡献文档

想要改进文档�?

1. Fork项目并创建分�?
2. 按照 [[contributing/documentation-guide|文档规范]] 编写
3. 提交Pull Request
4. 等待Review

---

## 📞 获取帮助

- 💬 [GitHub Discussions](https://github.com/BakerSean168/DailyUse/discussions) - 提问与讨�?
- 🐛 [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues) - 报告Bug
- 📧 Email: baker.sean168@gmail.com - 联系维护�?

---

**最后更�?\*: 2025-11-23  
**维护�?_: @BakerSean168  
**版本**: v2.0  
\*\*状�?_: 🔄 持续完善�?
