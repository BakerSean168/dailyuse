/**
 * @fileoverview 端到端加密服务
 * @module @dailyuse/infrastructure-client/encryption
 */

import type { EncryptedData, KeyDerivationParams } from './types';

// 条件导入：浏览器环境使用 Web Crypto API，Node.js 环境使用 crypto 模块
 
let nodeCrypto: any = null;

// 检测是否在 Node.js 环境
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;

if (isNode) {
  try {
    // 动态导入 crypto 模块（仅在 Node.js 环境）
     
    nodeCrypto = require('crypto');
  } catch {
    console.warn('[EncryptionService] Node.js crypto module not available');
  }
}

/**
 * 获取 crypto 模块引用（用于内部调用）
 */
function getCrypto(): typeof import('crypto') {
  if (!nodeCrypto) {
    throw new Error('EncryptionService is only available in Node.js environment. Use Web Crypto API for browser.');
  }
  return nodeCrypto;
}

/**
 * 加密服务 - 处理所有端到端加密操作
 * 
 * **设计原则**:
 * - 使用 AES-256-GCM (认证加密，防篡改)
 * - 使用 PBKDF2 进行密钥派生 (从密码生成密钥)
 * - 每次加密使用随机 IV (确保相同明文产生不同密文)
 * - 支持多密钥版本 (密钥轮换)
 * - 密钥不持久化存储 (仅在内存中)
 * 
 * **安全特性**:
 * - AES-256-GCM 提供认证加密 (AEAD)
 * - PBKDF2 600,000 次迭代 (OWASP 2023 推荐)
 * - 随机 IV 确保语义安全
 * - 认证标签防止数据篡改
 * 
 * @example
 * ```typescript
 * // 创建加密服务
 * const encryption = new EncryptionService('user-password-123');
 * 
 * // 加密数据
 * const goal = { id: '1', title: 'Learn TypeScript' };
 * const encrypted = encryption.encrypt(JSON.stringify(goal));
 * 
 * // 解密数据
 * const decrypted = encryption.decrypt(encrypted);
 * const goalRestored = JSON.parse(decrypted);
 * 
 * // 清理密钥
 * encryption.destroy();
 * ```
 */
export class EncryptionService {
  private currentKey: Buffer;
  private keyVersion: number = 1;
  private keyHistory: Map<number, Buffer> = new Map();
  private keyDerivationParams: KeyDerivationParams;
  private destroyed: boolean = false;
  
  // ===== 常量定义 =====
  
  /** AES-256 密钥大小 (256-bit = 32 bytes) */
  private static readonly KEY_SIZE = 32;
  
  /** GCM 模式初始向量大小 (96-bit = 12 bytes) */
  private static readonly IV_SIZE = 12;
  
  /** GCM 模式认证标签大小 (128-bit = 16 bytes) */
  private static readonly AUTH_TAG_SIZE = 16;
  
  /** 加密算法 */
  private static readonly ALGORITHM = 'aes-256-gcm';
  
  /** PBKDF2 迭代次数 (OWASP 2023 推荐) */
  private static readonly PBKDF2_ITERATIONS = 600000;
  
  /** PBKDF2 哈希函数 */
  private static readonly PBKDF2_HASH = 'sha256';
  
  /** 盐值大小 (256-bit = 32 bytes) */
  private static readonly SALT_SIZE = 32;
  
  /**
   * 构造函数 - 初始化加密服务
   * 
   * @param masterPassword - 主密码 (用于派生密钥)
   * @param salt - 可选的盐值 (Base64 编码)
   *                如果不提供，会自动生成新盐值
   * 
   * @example
   * ```typescript
   * // 首次使用 (生成新盐值)
   * const encryption = new EncryptionService('my-password');
   * const params = encryption.getKeyDerivationParams();
   * // 保存 params.salt 以便后续恢复
   * 
   * // 恢复使用 (使用已保存的盐值)
   * const encryption2 = new EncryptionService('my-password', params.salt);
   * ```
   */
  constructor(masterPassword: string, salt?: string) {
    // 验证密码强度
    if (!masterPassword || masterPassword.length < 8) {
      throw new Error('Master password must be at least 8 characters');
    }
    
    // 初始化密钥派生参数
    this.keyDerivationParams = {
      iterations: EncryptionService.PBKDF2_ITERATIONS,
      hash: EncryptionService.PBKDF2_HASH,
      salt: salt || this.generateSalt(),
    };
    
    // 从主密码派生密钥
    this.currentKey = this.deriveKey(masterPassword);
    this.keyHistory.set(this.keyVersion, this.currentKey);
  }
  
  // ===== 密钥派生 =====
  
  /**
   * 从密码派生加密密钥
   * 
   * 使用 PBKDF2 (Password-Based Key Derivation Function 2) 将用户密码
   * 转换为固定长度的加密密钥。
   * 
   * **为什么需要 PBKDF2?**
   * - 密码通常较短且熵低
   * - PBKDF2 通过多次迭代增加破解成本
   * - 使用盐值防止彩虹表攻击
   * 
   * @param password - 用户密码
   * @returns 派生的 256-bit 密钥
   * 
   * @private
   */
  private deriveKey(password: string): Buffer {
    return getCrypto().pbkdf2Sync(
      password,
      this.keyDerivationParams.salt,
      this.keyDerivationParams.iterations,
      EncryptionService.KEY_SIZE,
      EncryptionService.PBKDF2_HASH
    );
  }
  
  /**
   * 生成随机盐值
   * 
   * 盐值用于 PBKDF2，确保即使密码相同，派生的密钥也不同
   * 
   * @returns Base64 编码的盐值
   * 
   * @private
   */
  private generateSalt(): string {
    return getCrypto().randomBytes(EncryptionService.SALT_SIZE).toString('base64');
  }
  
  /**
   * 密钥轮换 - 生成新的加密密钥
   * 
   * **使用场景**:
   * - 用户修改密码
   * - 定期密钥轮换 (安全最佳实践)
   * - 密钥泄露后的应急措施
   * 
   * **注意**: 
   * - 旧密钥会保留在 keyHistory 中，用于解密历史数据
   * - 新数据将使用新密钥加密
   * 
   * @param newPassword - 新密码
   * 
   * @example
   * ```typescript
   * const encryption = new EncryptionService('old-password');
   * 
   * // 用户修改密码
   * encryption.rotateKey('new-password');
   * 
   * // 新数据使用新密钥加密
   * const encrypted = encryption.encrypt('new data');
   * 
   * // 仍然可以解密旧数据 (使用旧密钥)
   * const decrypted = encryption.decrypt(oldEncryptedData);
   * ```
   */
  rotateKey(newPassword: string): void {
    const newVersion = this.keyVersion + 1;
    const newKey = this.deriveKey(newPassword);
    
    // 保存旧密钥以兼容历史数据
    this.keyHistory.set(newVersion, newKey);
    this.currentKey = newKey;
    this.keyVersion = newVersion;
  }
  
  /**
   * 获取密钥派生参数
   * 
   * **用途**: 
   * - 保存盐值以便后续恢复
   * - 验证密钥派生配置
   * 
   * @returns 密钥派生参数的副本
   * 
   * @example
   * ```typescript
   * const params = encryption.getKeyDerivationParams();
   * localStorage.setItem('salt', params.salt);
   * ```
   */
  getKeyDerivationParams(): KeyDerivationParams {
    return { ...this.keyDerivationParams };
  }
  
  // ===== 加密操作 =====
  
  /**
   * 加密数据
   * 
   * 使用 AES-256-GCM 加密数据，并生成认证标签
   * 
   * **AES-256-GCM 特性**:
   * - 加密 + 认证 (AEAD - Authenticated Encryption with Associated Data)
   * - 防止数据篡改 (修改任何位都会导致解密失败)
   * - 高性能 (硬件加速)
   * 
   * **随机 IV**:
   * - 每次加密生成新的随机 IV
   * - 确保相同明文产生不同密文
   * - 防止密文分析攻击
   * 
   * @param plaintext - 待加密的数据 (字符串或 Buffer)
   * @returns 加密对象，包含加密数据、IV、认证标签等
   * 
   * @example
   * ```typescript
   * const goal = { id: '1', title: 'Learn Encryption' };
   * const encrypted = encryption.encrypt(JSON.stringify(goal));
   * 
   * console.log(encrypted);
   * // {
   * //   encryptedPayload: "abc123...",
   * //   iv: "def456...",
   * //   authTag: "ghi789...",
   * //   algorithm: "AES-256-GCM",
   * //   keyVersion: 1,
   * //   metadata: {
   * //     originalSize: 45,
   * //     timestamp: 1234567890,
   * //     checksum: "fedcba..."
   * //   }
   * // }
   * ```
   */
  encrypt(plaintext: string | Buffer): EncryptedData {
    if (this.destroyed) {
      throw new Error('EncryptionService has been destroyed');
    }
    
    // 转换为 Buffer
    const data = typeof plaintext === 'string' 
      ? Buffer.from(plaintext, 'utf-8')
      : plaintext;
    
    // 生成随机 IV (每次加密都不同)
    const iv = getCrypto().randomBytes(EncryptionService.IV_SIZE);
    
    // 创建加密器
    const cipher = getCrypto().createCipheriv(
      EncryptionService.ALGORITHM,
      this.currentKey,
      iv
    );
    
    // 加密数据
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    
    // 获取认证标签 (用于验证数据完整性)
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedPayload: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: 'AES-256-GCM',
      keyVersion: this.keyVersion,
      metadata: {
        originalSize: data.length,
        timestamp: Date.now(),
        checksum: this.calculateChecksum(data),
      },
    };
  }
  
  /**
   * 解密数据
   * 
   * 支持多版本密钥自动检测，可以解密使用旧密钥加密的数据
   * 
   * **认证验证**:
   * - GCM 模式会自动验证认证标签
   * - 如果数据被篡改，解密会失败
   * 
   * @param encrypted - 加密对象
   * @returns 解密后的原始数据 (UTF-8 字符串)
   * 
   * @throws {Error} 密钥版本不存在
   * @throws {Error} 解密失败 (错误的密钥或数据被篡改)
   * 
   * @example
   * ```typescript
   * try {
   *   const plaintext = encryption.decrypt(encrypted);
   *   const goal = JSON.parse(plaintext);
   *   console.log(goal.title); // 'Learn Encryption'
   * } catch (error) {
   *   console.error('Decryption failed:', error);
   *   // 可能的原因:
   *   // - 错误的密码
   *   // - 数据被篡改
   *   // - 密钥版本不匹配
   * }
   * ```
   */
  decrypt(encrypted: EncryptedData): string {
    if (this.destroyed) {
      throw new Error('EncryptionService has been destroyed');
    }
    
    // 获取正确的密钥版本
    const key = this.keyHistory.get(encrypted.keyVersion);
    if (!key) {
      throw new Error(
        `Key version ${encrypted.keyVersion} not found. ` +
        `Available versions: ${Array.from(this.keyHistory.keys()).join(', ')}`
      );
    }
    
    // 转换为 Buffer
    const encryptedPayload = Buffer.from(encrypted.encryptedPayload, 'base64');
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    
    // 创建解密器
    const decipher = getCrypto().createDecipheriv(
      EncryptionService.ALGORITHM,
      key,
      iv
    );
    
    // 设置认证标签 (用于验证数据完整性)
    decipher.setAuthTag(authTag);
    
    try {
      // 解密数据
      const decrypted = Buffer.concat([
        decipher.update(encryptedPayload),
        decipher.final(), // final() 会验证认证标签
      ]);
      
      return decrypted.toString('utf-8');
    } catch (error) {
      throw new Error(
        'Decryption failed: ' + 
        (error instanceof Error ? error.message : String(error)) +
        '. This usually means the data was tampered with or the key is incorrect.'
      );
    }
  }
  
  // ===== 数据完整性验证 =====
  
  /**
   * 校验数据完整性
   * 
   * 验证解密后的数据是否与原始数据一致
   * 
   * **注意**: GCM 模式已经提供认证保护，此方法提供额外验证
   * 
   * @param plaintext - 原始数据
   * @param encrypted - 加密对象
   * @returns 是否匹配
   * 
   * @example
   * ```typescript
   * const encrypted = encryption.encrypt('Hello World');
   * const decrypted = encryption.decrypt(encrypted);
   * 
   * const isValid = encryption.verifyChecksum(decrypted, encrypted);
   * console.log(isValid); // true
   * ```
   */
  verifyChecksum(plaintext: string, encrypted: EncryptedData): boolean {
    if (!encrypted.metadata?.checksum) {
      return false;
    }
    
    const expected = this.calculateChecksum(Buffer.from(plaintext, 'utf-8'));
    return expected === encrypted.metadata.checksum;
  }
  
  /**
   * 计算数据校验和 (SHA-256)
   * 
   * @param data - 数据
   * @returns 十六进制校验和
   * 
   * @private
   */
  private calculateChecksum(data: Buffer): string {
    const crypto = getCrypto();
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  // ===== 清理 =====
  
  /**
   * 清理所有密钥 (应用关闭时调用)
   * 
   * **安全清理**:
   * - 用零覆盖内存中的密钥
   * - 清空密钥历史
   * - 防止内存转储泄露密钥
   * 
   * **注意**: 调用后，加密服务不可再使用
   * 
   * @example
   * ```typescript
   * // 应用关闭时
   * window.addEventListener('beforeunload', () => {
   *   encryption.destroy();
   * });
   * ```
   */
  destroy(): void {
    if (this.destroyed) {
      return; // 已经销毁，避免重复操作
    }
    
    // 清理当前密钥
    this.currentKey.fill(0);
    
    // 清理密钥历史
    for (const [, key] of this.keyHistory) {
      key.fill(0);
    }
    
    this.keyHistory.clear();
    
    // 标记为已销毁
    this.destroyed = true;
  }
}
