/**
 * Infrastructure-internal barrel for the Data Portability Prisma import store.
 * 数据可移植性 Prisma import store 的基础设施内部 barrel。
 *
 * Concrete adapter classes live in Infrastructure; only the host-facing
 * factories in `../prisma.ts` consume them, never the Application layer.
 *
 * 具体适配器类位于 Infrastructure，仅供 `../prisma.ts` 中的宿主向工厂使用，
 * Application 层绝不引用。
 */

export { PrismaDataPortabilityImportStore } from './prisma-data-portability-import-store';
