# Architecture Index

这里是架构文档的薄入口，只保留导航。

优先级约定：

1. 先看代码中的入口注释和模块 README。
2. 需要项目级决策时再看 ADR。
3. 需要历史分析或专项整改背景时，再看带日期的分析文档。

## 先看哪里

- 系统概览: [system-overview.md](./system-overview.md)
- API 架构: [api-architecture.md](./api-architecture.md)
- Desktop 架构: [desktop-architecture.md](./desktop-architecture.md)
- ADR 索引: [adr/README.md](./adr/README.md)

## 与代码对应的入口

- API 启动: `apps/api/src/main.ts`
- Desktop 启动: `apps/desktop/src/main/main.ts`
- Logger 初始化: `packages/utils/src/winston.ts`
- Desktop 数据目录: `apps/desktop/src/main/user-data-path.ts`

## 什么时候不该再写新架构文档

- 只是解释某个函数、类、初始化顺序。
- 内容已经能通过源码注释表达清楚。
- 只是把现有代码结构翻译成另一份长文。
