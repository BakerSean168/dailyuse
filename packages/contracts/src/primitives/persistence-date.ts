/**
 * 数据库持久化层的时间类型定义。
 * 目前 Prisma + Postgres 返回的是 Date 对象。
 * 未来如果为了性能改为存储时间戳 (bigint/number)，只需修改此处定义即可。
 */
export type PersistenceDate = Date; 

// 或者如果你想更激进一点，为了兼容性考虑：
// export type PersistenceDate = Date | string;
