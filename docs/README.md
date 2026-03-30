# Docs Policy

`docs/` 只保留薄索引、决策记录和少量操作说明。

当前约定：

- 一线实现文档优先写在代码注释里，尤其是入口文件、组合根、基础设施初始化点。
- 模块级说明优先放在对应包目录，例如 `packages/*/README.md`、`packages/*/ARCHITECTURE.md`。
- `docs/` 负责回答“去哪里看”，而不是复制实现细节。
- 失效的实现说明应直接删掉或改成指向代码的短文档，不保留大段过期描述。

## 先看哪里

- 架构入口: [architecture/README.md](./architecture/README.md)
- 开发入口: [guides/development/README.md](./guides/development/README.md)
- 入门入口: [getting-started/README.md](./getting-started/README.md)
- Governance 活文档: [governance/README.md](./governance/README.md)

## 与代码的分工

- Logger 与运行时路径: `packages/utils/src/logger/*`, `packages/utils/src/winston.ts`, `apps/api/src/shared/infrastructure/config/logger.config.ts`, `apps/desktop/src/main/user-data-path.ts`, `apps/desktop/src/main/main.ts`
- API 启动链路: `apps/api/src/main.ts`
- Desktop 启动链路: `apps/desktop/src/main/main.ts`
- 模块实现: `packages/<module>/src/**`

## 清理原则

- 可以从代码直接看懂的实现细节，不再在 `docs/` 重复展开。
- 过期路径、过期命令、过期运行时行为说明必须优先修正或删除。
- 与产品运行无关的个人工具配置或历史材料，不放在 `docs/` 主导航语义里。
