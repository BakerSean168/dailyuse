import { describe, expect, it } from 'vitest';
import { PrismaTaskFolderMapper } from './prisma-task-folder-mapper';
import type { TaskFolder as PrismaTaskFolder } from '@dailyuse/database';

describe('PrismaTaskFolderMapper', () => {
  const createMinimalRow = (): PrismaTaskFolder => ({
    id: 'folder-1',
    identityId: 'identity-1',
    name: 'My Tasks',
    color: null,
    icon: null,
    order: 0,
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  });

  const createFullRow = (): PrismaTaskFolder => ({
    id: 'folder-2',
    identityId: 'identity-2',
    name: 'Important Tasks',
    color: '#FF5733',
    icon: 'star',
    order: 1,
    version: 2,
    createdAt: new Date('2024-02-15T10:30:45Z'),
    updatedAt: new Date('2024-02-20T14:45:30Z'),
    deletedAt: new Date('2024-03-01T00:00:00Z'),
  });

  describe('toDTO', () => {
    it('maps minimal Prisma row to DTO', () => {
      const row = createMinimalRow();
      const dto = PrismaTaskFolderMapper.toDTO(row);

      expect(dto.id).toBe('folder-1');
      expect(dto.identityId).toBe('identity-1');
      expect(dto.name).toBe('My Tasks');
      expect(dto.color).toBeNull();
      expect(dto.icon).toBeNull();
      expect(dto.order).toBe(0);
      expect(dto.version).toBe(1);
      expect(dto.createdAt).toBe(row.createdAt.getTime());
      expect(dto.updatedAt).toBe(row.updatedAt.getTime());
      expect(dto.deletedAt).toBeNull();
    });

    it('maps full Prisma row with all fields to DTO', () => {
      const row = createFullRow();
      const dto = PrismaTaskFolderMapper.toDTO(row);

      expect(dto.id).toBe('folder-2');
      expect(dto.identityId).toBe('identity-2');
      expect(dto.name).toBe('Important Tasks');
      expect(dto.color).toBe('#FF5733');
      expect(dto.icon).toBe('star');
      expect(dto.order).toBe(1);
      expect(dto.version).toBe(2);
      expect(dto.createdAt).toBe(row.createdAt.getTime());
      expect(dto.updatedAt).toBe(row.updatedAt.getTime());
      expect(dto.deletedAt).toBe(row.deletedAt!.getTime());
    });

    it('converts nullable color and icon to null', () => {
      const row = createMinimalRow();
      const dto = PrismaTaskFolderMapper.toDTO(row);

      expect(dto.color).toBeNull();
      expect(dto.icon).toBeNull();
    });

    it('handles Date timestamps correctly', () => {
      const createdAt = new Date('2024-03-01T12:00:00Z');
      const updatedAt = new Date('2024-03-15T18:30:00Z');
      const deletedAt = new Date('2024-04-01T00:00:00Z');
      const row: PrismaTaskFolder = {
        ...createMinimalRow(),
        createdAt,
        updatedAt,
        deletedAt,
      };

      const dto = PrismaTaskFolderMapper.toDTO(row);
      expect(dto.createdAt).toBe(createdAt.getTime());
      expect(dto.updatedAt).toBe(updatedAt.getTime());
      expect(dto.deletedAt).toBe(deletedAt.getTime());
    });

    it('handles numeric timestamps (edge case)', () => {
      const row = createMinimalRow();
      const timestamp = 1704067200000;
      const rowWithNumericTimestamps: PrismaTaskFolder = {
        ...row,
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
      };

      const dto = PrismaTaskFolderMapper.toDTO(rowWithNumericTimestamps);
      expect(dto.createdAt).toBe(timestamp);
      expect(dto.updatedAt).toBe(timestamp);
    });

    it('maps deletedAt to null when not soft-deleted', () => {
      const row = createMinimalRow();
      const dto = PrismaTaskFolderMapper.toDTO(row);
      expect(dto.deletedAt).toBeNull();
    });

    it('maps deletedAt timestamp when soft-deleted', () => {
      const row = createFullRow();
      const dto = PrismaTaskFolderMapper.toDTO(row);
      expect(dto.deletedAt).toBe(row.deletedAt!.getTime());
    });
  });

  describe('toDTOList', () => {
    it('maps empty list to empty list', () => {
      const result = PrismaTaskFolderMapper.toDTOList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows to DTOs preserving order', () => {
      const rows = [createMinimalRow(), createFullRow(), createMinimalRow()];
      const dtos = PrismaTaskFolderMapper.toDTOList(rows);

      expect(dtos).toHaveLength(3);
      expect(dtos[0].id).toBe('folder-1');
      expect(dtos[1].id).toBe('folder-2');
      expect(dtos[2].id).toBe('folder-1');
    });

    it('batch converts all fields correctly', () => {
      const rows = [createMinimalRow(), createFullRow()];
      const dtos = PrismaTaskFolderMapper.toDTOList(rows);

      expect(dtos[0].color).toBeNull();
      expect(dtos[1].color).toBe('#FF5733');
      expect(dtos[0].deletedAt).toBeNull();
      expect(dtos[1].deletedAt).not.toBeNull();
    });
  });
});
