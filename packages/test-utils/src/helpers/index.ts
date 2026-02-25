/**
 * Test Helpers
 *
 * 通用测试辅助工具函数
 */

import { randomUUID } from 'node:crypto';

/**
 * 生成 UUID
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * 生成随机字符串
 */
export function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成随机邮箱
 */
export function randomEmail(): string {
  return `test-${randomString(6)}@example.com`;
}

/**
 * 生成随机数
 */
export function randomNumber(min = 0, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 等待条件满足
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor: condition not met within ${timeout}ms`);
}

/**
 * 创建 Date 对象（便于测试中创建时间戳）
 */
export function createDate(daysFromNow = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * 创建 timestamp（毫秒）
 */
export function createTimestamp(daysFromNow = 0): number {
  return createDate(daysFromNow).getTime();
}
