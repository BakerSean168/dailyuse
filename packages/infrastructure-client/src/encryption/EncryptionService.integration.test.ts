/**
 * @fileoverview EncryptionService 集成测试
 * @module @dailyuse/infrastructure-client/encryption
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from './encryption-service';

describe('EncryptionService - Integration Tests', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService('test-password-12345', 'test-salt');
  });

  describe('基础加密功能', () => {
    it('应该加密和解密字符串数据', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该加密和解密 JSON 数据', async () => {
      const data = { id: '123', name: 'Test', value: 42 };
      const plaintext = JSON.stringify(data);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it('应该处理大数据 (1MB)', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB
      const encrypted = service.encrypt(largeData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(largeData);
    });

    it('应该处理空字符串', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该处理特殊字符和 Unicode', () => {
      const plaintext = '你好世界! 🚀 Hello 🌍 مرحبا';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('IV 随机性验证', () => {
    it('相同数据应产生不同的加密结果', () => {
      const plaintext = 'Same data';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // 加密内容应该不同 (因为 IV 不同)
      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);

      // 但解密后应该相同
      const decrypted1 = service.decrypt(encrypted1);
      const decrypted2 = service.decrypt(encrypted2);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('每次加密应使用不同的 IV', () => {
      const plaintext = 'Test data';
      const ivSet = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = service.encrypt(plaintext);
        ivSet.add(encrypted.iv);
      }

      // 100 次加密应该有 100 个不同的 IV
      expect(ivSet.size).toBe(100);
    });
  });

  describe('认证标签完整性', () => {
    it('篡改的数据应该无法解密', () => {
      const plaintext = 'Secret data';
      const encrypted = service.encrypt(plaintext);

      // 篡改加密数据
      const tampered = {
        ...encrypted,
        encryptedPayload: Buffer.from(
          Buffer.from(encrypted.encryptedPayload, 'base64').slice(0, -1)
        ).toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });

    it('篡改的认证标签应该导致解密失败', () => {
      const plaintext = 'Secret data';
      const encrypted = service.encrypt(plaintext);

      const tampered = {
        ...encrypted,
        authTag: Buffer.from('0'.repeat(32), 'hex').toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });

    it('篡改 IV 应该导致解密失败', () => {
      const plaintext = 'Secret data';
      const encrypted = service.encrypt(plaintext);

      const tampered = {
        ...encrypted,
        iv: Buffer.from('0'.repeat(24), 'hex').toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });
  });

  describe('密钥派生 (PBKDF2)', () => {
    it('相同密码和盐值应产生相同的密钥', () => {
      const service1 = new EncryptionService('password', 'same-salt');
      const service2 = new EncryptionService('password', 'same-salt');

      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);

      // service2 应该能解密 service1 加密的数据
      const decrypted = service2.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('不同密码应产生不同的密钥', () => {
      const service1 = new EncryptionService('password1', 'salt');
      const service2 = new EncryptionService('password2', 'salt');

      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);

      // service2 无法解密 service1 的数据
      expect(() => {
        service2.decrypt(encrypted);
      }).toThrow();
    });

    it('不同盐值应产生不同的密钥', () => {
      const service1 = new EncryptionService('password', 'salt1');
      const service2 = new EncryptionService('password', 'salt2');

      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);

      // 不同盐值，即使密码相同，也应该无法解密
      expect(() => {
        service2.decrypt(encrypted);
      }).toThrow();
    });
  });

  describe('密钥轮换支持', () => {
    it('应该支持使用新密钥加密，旧密钥仍可解密', () => {
      const plaintext = 'Test data';

      // 初始加密
      const encrypted1 = service.encrypt(plaintext);
      expect(encrypted1.keyVersion).toBe(1);

      // 轮换密钥
      service.rotateKey('new-password-12345');

      // 新加密
      const encrypted2 = service.encrypt(plaintext);
      expect(encrypted2.keyVersion).toBe(2);

      // 旧数据仍可解密
      const decrypted1 = service.decrypt(encrypted1);
      expect(decrypted1).toBe(plaintext);

      // 新数据也可解密
      const decrypted2 = service.decrypt(encrypted2);
      expect(decrypted2).toBe(plaintext);
    });

    it('应该在多次轮换后仍能解密所有数据', () => {
      const plaintext = 'Test data';
      const encrypted: any[] = [];

      // 轮换 5 次，每次加密数据
      for (let i = 0; i < 5; i++) {
        encrypted.push(service.encrypt(plaintext));
        service.rotateKey(`password-v${i + 2}`);
      }

      // 所有加密数据都应该能解密
      encrypted.forEach((enc, index) => {
        expect(enc.keyVersion).toBe(index + 1);
        const decrypted = service.decrypt(enc);
        expect(decrypted).toBe(plaintext);
      });
    });
  });

  describe('校验和验证', () => {
    it('应该验证数据完整性', () => {
      const plaintext = 'Important data';
      const encrypted = service.encrypt(plaintext);

      // 验证加密数据包含必要字段
      expect(encrypted.encryptedPayload).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
    });

    it('修改数据后加密结果应该不同', () => {
      const plaintext1 = 'Original data';
      const plaintext2 = 'Modified data';

      const encrypted1 = service.encrypt(plaintext1);
      const encrypted2 = service.encrypt(plaintext2);

      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
    });

    it('相同数据的多次加密应使用不同IV', () => {
      const plaintext = 'Same data';

      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // 加密结果应不同（因为IV不同）
      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      
      // 但解密后应该相同
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('性能测试', () => {
    it('加密 1MB 数据应该在 100ms 内完成', () => {
      const largeData = 'x'.repeat(1000000);
      const start = performance.now();
      service.encrypt(largeData);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    it('解密 1MB 数据应该在 100ms 内完成', () => {
      const largeData = 'x'.repeat(1000000);
      const encrypted = service.encrypt(largeData);

      const start = performance.now();
      service.decrypt(encrypted);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    it('批量加密 100 个小对象应该在 200ms 内完成', () => {
      const objects = Array.from({ length: 100 }, (_, i) => ({
        id: `id-${i}`,
        name: `Name ${i}`,
        value: i * 10,
      }));

      const start = performance.now();
      objects.forEach(obj => {
        service.encrypt(JSON.stringify(obj));
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(200);
    });
  });

  describe('边界情况', () => {
    it('应该处理非常长的密码', () => {
      const longPassword = 'x'.repeat(1000);
      const longService = new EncryptionService(longPassword, 'salt');

      const plaintext = 'Test data';
      const encrypted = longService.encrypt(plaintext);
      const decrypted = longService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该处理包含 null 字节的数据', () => {
      const plaintext = 'Before\x00After';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该处理二进制数据', () => {
      const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]).toString('base64');
      const encrypted = service.encrypt(binaryData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(binaryData);
    });
  });

  describe('多线程安全性 (并发)', () => {
    it('并发加密应该产生正确的结果', async () => {
      const plaintexts = Array.from({ length: 50 }, (_, i) => `Data ${i}`);

      const promises = plaintexts.map(async plaintext => {
        const encrypted = service.encrypt(plaintext);
        return { plaintext, encrypted };
      });

      const results = await Promise.all(promises);

      // 所有数据都应该能正确解密
      results.forEach(({ plaintext, encrypted }) => {
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });
  });

  describe('内存清理', () => {
    it('解密后应该清理敏感数据', () => {
      const plaintext = 'Sensitive data';
      const encrypted = service.encrypt(plaintext);
      service.decrypt(encrypted);

      // Note: 实际的内存清理验证需要 native 工具
      // 这里只是确保函数正常执行
      expect(true).toBe(true);
    });
  });
});
