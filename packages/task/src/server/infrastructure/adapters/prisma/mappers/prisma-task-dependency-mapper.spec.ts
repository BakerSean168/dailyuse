import { describe, expect, it } from 'vitest';
import { PrismaTaskDependencyMapper } from './prisma-task-dependency-mapper';
import type { TaskDependency as PrismaTaskDependency } from '@memoflow/database';

describe('PrismaTaskDependencyMapper', () => {
  const createMinimalRow = (): PrismaTaskDependency => ({
    id: 'dep-1',
    identityId: 'identity-1',
    predecessorTaskId: 'task-pred-1',
    successorTaskId: 'task-succ-1',
    dependencyType: 'FS',
    lagDays: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  });

  const createFullRow = (): PrismaTaskDependency => ({
    id: 'dep-2',
    identityId: 'identity-2',
    predecessorTaskId: 'task-pred-2',
    successorTaskId: 'task-succ-2',
    dependencyType: 'SS',
    lagDays: 2,
    createdAt: new Date('2024-02-15T10:30:45Z'),
    updatedAt: new Date('2024-02-20T14:45:30Z'),
  });

  describe('toDTO', () => {
    it('maps minimal Prisma row to DTO', () => {
      const row = createMinimalRow();
      const dto = PrismaTaskDependencyMapper.toDTO(row);

      expect(dto.id).toBe('dep-1');
      expect(dto.identityId).toBe('identity-1');
      expect(dto.predecessorTaskId).toBe('task-pred-1');
      expect(dto.successorTaskId).toBe('task-succ-1');
      expect(dto.dependencyType).toBe('FS');
      expect(dto.lagDays).toBeUndefined();
      expect(dto.createdAt).toBe(row.createdAt.getTime());
      expect(dto.updatedAt).toBe(row.updatedAt.getTime());
    });

    it('maps full Prisma row with lagDays to DTO', () => {
      const row = createFullRow();
      const dto = PrismaTaskDependencyMapper.toDTO(row);

      expect(dto.id).toBe('dep-2');
      expect(dto.identityId).toBe('identity-2');
      expect(dto.predecessorTaskId).toBe('task-pred-2');
      expect(dto.successorTaskId).toBe('task-succ-2');
      expect(dto.dependencyType).toBe('SS');
      expect(dto.lagDays).toBe(2);
      expect(dto.createdAt).toBe(row.createdAt.getTime());
      expect(dto.updatedAt).toBe(row.updatedAt.getTime());
    });

    it('converts nullable lagDays to undefined', () => {
      const row = createMinimalRow();
      const dto = PrismaTaskDependencyMapper.toDTO(row);
      expect(dto.lagDays).toBeUndefined();
    });

    it('correctly converts timestamps to milliseconds', () => {
      const createdAt = new Date('2024-03-01T12:00:00Z');
      const updatedAt = new Date('2024-03-15T18:30:00Z');
      const row: PrismaTaskDependency = {
        ...createMinimalRow(),
        createdAt,
        updatedAt,
      };

      const dto = PrismaTaskDependencyMapper.toDTO(row);
      expect(dto.createdAt).toBe(createdAt.getTime());
      expect(dto.updatedAt).toBe(updatedAt.getTime());
    });

    it('maps all dependency types correctly', () => {
      const dependencyTypes = ['FS', 'SS', 'FF', 'SF'] as const;

      for (const type of dependencyTypes) {
        const row: PrismaTaskDependency = {
          ...createMinimalRow(),
          dependencyType: type as any,
        };
        const dto = PrismaTaskDependencyMapper.toDTO(row);
        expect(dto.dependencyType).toBe(type);
      }
    });
  });

  describe('toDTOList', () => {
    it('maps empty list to empty list', () => {
      const result = PrismaTaskDependencyMapper.toDTOList([]);
      expect(result).toEqual([]);
    });

    it('maps multiple rows to DTOs', () => {
      const rows = [createMinimalRow(), createFullRow()];
      const dtos = PrismaTaskDependencyMapper.toDTOList(rows);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('dep-1');
      expect(dtos[1].id).toBe('dep-2');
    });

    it('preserves order of rows in batch conversion', () => {
      const rows = [createFullRow(), createMinimalRow(), createFullRow()];
      const dtos = PrismaTaskDependencyMapper.toDTOList(rows);

      expect(dtos[0].lagDays).toBe(2);
      expect(dtos[1].lagDays).toBeUndefined();
      expect(dtos[2].lagDays).toBe(2);
    });
  });
});
