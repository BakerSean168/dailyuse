/**
 * UUID 生成工具（跨端）
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 使用 uuid 库生成标准 UUID v4
 * 推荐使用此方法
 */
export const newId = () => uuidv4();

/**
 * 生成 UUID v4（跨平台兼容实现，不依赖 uuid 库）
 */
export function generateUUID(): string {
  // 优先使用原生 API
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级方案
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 验证 UUID 格式
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 生成短 ID（用于临时标识符）
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
