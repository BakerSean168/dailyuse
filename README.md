# 知行 MemoFlow

知行 MemoFlow 是一个使用 `pnpm` + `Nx` 管理的多应用工作区，承载桌面端、Web、API、AI Service 与共享领域包。项目旨在构建一个 AI 驱动的个人效能管理系统，支持目标管理、任务调度、知识资源、AI 对话等功能。仓库中的文档、配置和测试以当前代码现实为准；如果文档与代码冲突，以代码、`project.json`、`nx.json`、测试配置和测试结果为准。

## 工作区概览

- `apps/desktop`：Electron 桌面应用，前端栈是 Vue 3 + Vite。
- `apps/web`：Web 应用，使用 Vue 3 + Vite。
- `apps/api`：Express 5 API，配合 Zod、OpenAPI、Prisma。
- `apps/mobile`：移动端应用容器（规划中）。
- `apps/ai-service`：Python FastAPI AI 服务，提供 AI 工作流编排、Provider 管理等功能。
- `packages/*`：按领域拆分的共享业务包（account、ai、goal、task 等），以及 `contracts`、`domain-shared`、`ui-*`、`utils` 等基础包。
- `tools/*`：工作区脚本、测试治理和 Docker 辅助工具。
- `docs/`：唯一维护中的正式文档入口。

## 技术基线

- 包管理：`pnpm@11`
- 工作区编排：`nx@22`
- 语言：TypeScript 5
- 桌面端：Electron 39 + Vue 3
- Web：Vue 3 + Vite
- API：Express 5 + Zod + Prisma
- 测试与质量：Vitest、Playwright、ESLint flat config、Prettier

## 目录结构

```text
.
├── apps/
│   ├── api/
│   ├── desktop/
│   ├── mobile/
│   ├── web/
│   └── ai-service/
├── packages/
│   ├── account/ ai/ authentication/ dashboard/ goal/ governance/
│   ├── notification/ reminder/ schedule/ setting/ task/ ...
│   ├── contracts/ domain-shared/
│   ├── app-vue/ app-react/
│   ├── ui-core/ ui-vue-shadcn/ ui-react-native/
│   └── utils/ assets/ test-utils/
├── tools/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── standards/
│   ├── guides/
│   ├── test/
│   ├── governance/
│   └── plan/
├── nx.json
├── eslint.config.ts
├── project.json
└── package.json
```

## 常用命令

所有工作区任务统一使用 `pnpm nx ...`。

```bash
pnpm install
pnpm nx run-many -t serve --projects=api,web
pnpm nx run desktop:serve
pnpm nx run-many -t lint,typecheck --all
pnpm nx run memoflow:docs-check
```

## 文档导航

- 入门：[`docs/getting-started/README.md`](docs/getting-started/README.md)
- 产品功能资产：[`docs/product/README.md`](docs/product/README.md)
- 架构：[`docs/architecture/README.md`](docs/architecture/README.md)
- ADR 索引：[`docs/architecture/adr/README.md`](docs/architecture/adr/README.md)
- 规范：[`docs/standards/README.md`](docs/standards/README.md)
- 开发指南：[`docs/guides/development/README.md`](docs/guides/development/README.md)
- 测试：[`docs/test/README.md`](docs/test/README.md)
- 治理：[`docs/governance/README.md`](docs/governance/README.md)
- 计划：[`docs/plan/README.md`](docs/plan/README.md)
- 部署：[`docs/deployment/README.md`](docs/deployment/README.md)

## Onboarding

1. 先看根 README，确认 app、package 与文档入口。
2. 再看 [`docs/getting-started/README.md`](docs/getting-started/README.md) 和 [`docs/guides/development/README.md`](docs/guides/development/README.md)。
3. 需要规则时看 `docs/standards`；需要决策背景时看 ADR；需要真实行为时读代码、配置和测试。

桌面端在 Windows 开发模式下的日志目录：
`C:\Users\xx\AppData\Roaming\MemoFlow-Dev\logs`
