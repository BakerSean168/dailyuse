import { describe, expect, it, vi } from 'vitest';
import type { IResultIpcClient } from '../../types';
import type { ExportUserDataReq, ExportUserDataRes, ImportUserDataReq, ImportUserDataRes } from '@dailyuse/contracts/data-portability';
import type { Result } from '@dailyuse/contracts/result';
import { DataPortabilityIpcAdapter } from '../data-portability-ipc.adapter';

function createMockIpcClient(): IResultIpcClient & { invoke: ReturnType<typeof vi.fn> } {
  return {
    invoke: vi.fn(),
  };
}

describe('DataPortabilityIpcAdapter', () => {
  describe('exportUserData', () => {
    it('invokes the correct IPC channel with the provided DTO', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const successResult: Result<ExportUserDataRes> = {
        ok: true,
        data: {
          fileName: 'test-export.json',
          content: '{"kind":"memoflow.user-data-export"}',
          summary: { entityCounts: { settings: 1 }, warnings: [] },
        },
      };
      mockClient.invoke.mockResolvedValue(successResult);

      const dto: ExportUserDataReq = { include: ['settings'] };
      await adapter.exportUserData(dto);

      expect(mockClient.invoke).toHaveBeenCalledOnce();
      expect(mockClient.invoke).toHaveBeenCalledWith('data-portability:export', dto);
    });

    it('forwards the success Result from invoke unchanged', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const successResult: Result<ExportUserDataRes> = {
        ok: true,
        data: {
          fileName: 'export.json',
          content: '{}',
          summary: { entityCounts: {}, warnings: [] },
        },
      };
      mockClient.invoke.mockResolvedValue(successResult);

      const result = await adapter.exportUserData({});

      expect(result).toBe(successResult);
    });

    it('forwards the failure Result from invoke unchanged', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const failureResult: Result<ExportUserDataRes> = {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
        },
      };
      mockClient.invoke.mockResolvedValue(failureResult);

      const result = await adapter.exportUserData({ include: ['bad-module' as any] });

      expect(result).toBe(failureResult);
    });
  });

  describe('importUserData', () => {
    it('invokes the correct IPC channel with the provided DTO', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const successResult: Result<ImportUserDataRes> = {
        ok: true,
        data: {
          batchId: 'batch-1',
          dryRun: false,
          created: { settings: 1 },
          updatedSingletons: {},
          skipped: {},
          warnings: [],
        },
      };
      mockClient.invoke.mockResolvedValue(successResult);

      const dto: ImportUserDataReq = {
        content: '{"kind":"memoflow.user-data-export","schemaVersion":1}',
        dryRun: false,
      };
      await adapter.importUserData(dto);

      expect(mockClient.invoke).toHaveBeenCalledOnce();
      expect(mockClient.invoke).toHaveBeenCalledWith('data-portability:import', dto);
    });

    it('forwards the success Result from invoke unchanged', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const successResult: Result<ImportUserDataRes> = {
        ok: true,
        data: {
          batchId: 'batch-2',
          dryRun: false,
          created: { goals: 2, tasks: 3 },
          updatedSingletons: { settings: 1 },
          skipped: {},
          warnings: [],
        },
      };
      mockClient.invoke.mockResolvedValue(successResult);

      const result = await adapter.importUserData({ content: '{}' });

      expect(result).toBe(successResult);
    });

    it('forwards the failure Result from invoke unchanged', async () => {
      const mockClient = createMockIpcClient();
      const adapter = new DataPortabilityIpcAdapter(mockClient);

      const failureResult: Result<ImportUserDataRes> = {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON content',
        },
      };
      mockClient.invoke.mockResolvedValue(failureResult);

      const result = await adapter.importUserData({ content: '{bad json' });

      expect(result).toBe(failureResult);
    });
  });
});
