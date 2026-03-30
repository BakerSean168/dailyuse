# Logging And Tools

这份文档只保留排障入口，不重复实现细节。

## 先看代码

- Logger factory 与热切换原因: `packages/utils/src/logger/LoggerFactory.ts`
- Winston 文件日志初始化: `packages/utils/src/winston.ts`
- Winston 文件目录与轮转: `packages/utils/src/logger/WinstonLogger.ts`
- API 日志目录配置: `apps/api/src/shared/infrastructure/config/logger.config.ts`
- Desktop 日志目录配置: `apps/desktop/src/main/user-data-path.ts`
- Desktop 启动期 logger 初始化: `apps/desktop/src/main/main.ts`

## 当前日志落点

- API: `<workspace>/data/logs`
- Desktop: `<userData>/data/logs`
- Docker 服务日志: 容器标准输出，不走应用 logger 文件

## 常用命令

- `pnpm nx serve api`
- `pnpm nx serve desktop`
- `docker logs -f dailyuse-dev-powersync`
- `docker logs -f dailyuse-dev-db`

## 维护规则

- 日志路径变化时，先改代码注释，再只更新这里的路径摘要。
- 不在这里复制 transport 细节、调用样例或旧行为说明。
