/**
 * AuthCredentialPrismaRepository Tests
 *
 * Unit tests for Prisma-based credential repository.
 * Uses in-memory Prisma client for testing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthCredentialPrismaRepository } from '../auth-credential-prisma.repository';
import { AuthCredential } from '@dailyuse/domain-server/authentication';

describe('AuthCredentialPrismaRepository', () => {
  let repository: AuthCredentialPrismaRepository;
  let mockPrismaClient: any;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrismaClient = {
      authCredential: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new AuthCredentialPrismaRepository(mockPrismaClient);
  });

  describe('save', () => {
    it('should save credential with upsert pattern', async () => {
      const credential = AuthCredential.create({
        accountUuid: 'account-123',
        type: 'PASSWORD',
      });

      credential.setPassword('hashed_password_123');

      mockPrismaClient.authCredential.upsert.mockResolvedValue({
        uuid: credential.uuid,
      });

      await repository.save(credential);

      expect(mockPrismaClient.authCredential.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uuid: credential.uuid },
          create: expect.objectContaining({
            uuid: credential.uuid,
            accountUuid: 'account-123',
            type: 'PASSWORD',
          }),
          update: expect.any(Object),
        })
      );
    });

    it('should handle transaction client', async () => {
      const credential = AuthCredential.create({
        accountUuid: 'account-123',
        type: 'PASSWORD',
      });

      const mockTxClient = {
        authCredential: {
          upsert: vi.fn().mockResolvedValue({}),
        },
      };

      await repository.save(credential, mockTxClient);

      expect(mockTxClient.authCredential.upsert).toHaveBeenCalled();
      expect(mockPrismaClient.authCredential.upsert).not.toHaveBeenCalled();
    });

    it('should serialize password credential as JSON string', async () => {
      const credential = AuthCredential.create({
        accountUuid: 'account-123',
        type: 'PASSWORD',
      });

      credential.setPassword('hashed_password_123');

      mockPrismaClient.authCredential.upsert.mockResolvedValue({});

      await repository.save(credential);

      const upsertCall = mockPrismaClient.authCredential.upsert.mock.calls[0][0];
      const createData = upsertCall.create;

      // Check data field is JSON string
      expect(typeof createData.data).toBe('string');
      const parsedData = JSON.parse(createData.data);
      expect(parsedData.password_credential).toBeDefined();
      
      // password_credential is a JSON string, need to parse it again
      const passwordCred = JSON.parse(parsedData.password_credential);
      expect(passwordCred.hashed_password).toBe('hashed_password_123');
    });
  });

  describe('findByUuid', () => {
    it('should find credential by UUID', async () => {
      const mockData = {
        uuid: 'cred-123',
        accountUuid: 'account-123',
        type: 'PASSWORD',
        data: JSON.stringify({
          password_credential: {
            hashedPassword: 'hashed_password_123',
            salt: 'salt_123',
          },
          api_key_credentials: [],
          remember_me_tokens: [],
        }),
        metadata: '{}',
        history: '[]',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.authCredential.findUnique.mockResolvedValue(mockData);

      const credential = await repository.findByUuid('cred-123');

      expect(credential).toBeDefined();
      expect(credential?.uuid).toBe('cred-123');
      expect(credential?.accountUuid).toBe('account-123');
      expect(mockPrismaClient.authCredential.findUnique).toHaveBeenCalledWith({
        where: { uuid: 'cred-123' },
      });
    });

    it('should return null if not found', async () => {
      mockPrismaClient.authCredential.findUnique.mockResolvedValue(null);

      const credential = await repository.findByUuid('nonexistent');

      expect(credential).toBeNull();
    });

    it('should use transaction client when provided', async () => {
      const mockTxClient = {
        authCredential: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      await repository.findByUuid('cred-123', mockTxClient);

      expect(mockTxClient.authCredential.findUnique).toHaveBeenCalled();
      expect(mockPrismaClient.authCredential.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findByAccountUuid', () => {
    it('should find credential by account UUID', async () => {
      const mockData = {
        uuid: 'cred-123',
        accountUuid: 'account-123',
        type: 'PASSWORD',
        data: JSON.stringify({
          password_credential: null,
          api_key_credentials: [],
          remember_me_tokens: [],
        }),
        metadata: '{}',
        history: '[]',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.authCredential.findFirst.mockResolvedValue(mockData);

      const credential = await repository.findByAccountUuid('account-123');

      expect(credential).toBeDefined();
      expect(credential?.accountUuid).toBe('account-123');
    });
  });

  describe('findByStatus', () => {
    it('should find credentials by status', async () => {
      mockPrismaClient.authCredential.findMany.mockResolvedValue([
        {
          uuid: 'cred-1',
          accountUuid: 'account-1',
          type: 'PASSWORD',
          data: JSON.stringify({
            password_credential: null,
            api_key_credentials: [],
            remember_me_tokens: [],
          }),
          metadata: '{}',
          history: '[]',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'cred-2',
          accountUuid: 'account-2',
          type: 'API_KEY',
          data: JSON.stringify({
            password_credential: null,
            api_key_credentials: [],
            remember_me_tokens: [],
          }),
          metadata: '{}',
          history: '[]',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const credentials = await repository.findByStatus('ACTIVE');

      expect(credentials).toHaveLength(2);
      expect(mockPrismaClient.authCredential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { metadata: { contains: '"status":"ACTIVE"' } },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaClient.authCredential.findMany.mockResolvedValue([]);

      await repository.findByStatus('ACTIVE', { skip: 10, take: 20 });

      expect(mockPrismaClient.authCredential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('findByType', () => {
    it('should find credentials by type', async () => {
      mockPrismaClient.authCredential.findMany.mockResolvedValue([]);

      await repository.findByType('API_KEY');

      expect(mockPrismaClient.authCredential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'API_KEY' },
        })
      );
    });
  });

  describe('existsByAccountUuid', () => {
    it('should return true if credential exists', async () => {
      mockPrismaClient.authCredential.count.mockResolvedValue(1);

      const exists = await repository.existsByAccountUuid('account-123');

      expect(exists).toBe(true);
    });

    it('should return false if credential does not exist', async () => {
      mockPrismaClient.authCredential.count.mockResolvedValue(0);

      const exists = await repository.existsByAccountUuid('account-123');

      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete credential by UUID', async () => {
      mockPrismaClient.authCredential.delete.mockResolvedValue({});

      await repository.delete('cred-123');

      expect(mockPrismaClient.authCredential.delete).toHaveBeenCalledWith({
        where: { uuid: 'cred-123' },
      });
    });

    it('should use transaction client when provided', async () => {
      const mockTxClient = {
        authCredential: {
          delete: vi.fn().mockResolvedValue({}),
        },
      };

      await repository.delete('cred-123', mockTxClient);

      expect(mockTxClient.authCredential.delete).toHaveBeenCalled();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired credentials', async () => {
      mockPrismaClient.authCredential.deleteMany.mockResolvedValue({ count: 5 });

      const count = await repository.deleteExpired();

      expect(count).toBe(5);
      expect(mockPrismaClient.authCredential.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            metadata: { contains: '"status":"EXPIRED"' },
          },
        })
      );
    });
  });
});
