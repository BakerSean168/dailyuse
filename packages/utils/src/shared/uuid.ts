/**
 * UUID 生成工具
 */

function getRandomUUID(): () => string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);

  if (!randomUUID) {
    throw new Error('crypto.randomUUID() is required but not available in this runtime');
  }

  return randomUUID;
}

/**
 * 生成标准 UUID
 */
export function generateUUID(): string {
  return getRandomUUID()();
}

/**
 * 兼容旧调用方的别名
 */
export const newId = generateUUID;

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
  const randomPart = generateUUID().replace(/-/g, '').slice(0, 9);
  return `${randomPart}${Date.now().toString(36)}`;
}
