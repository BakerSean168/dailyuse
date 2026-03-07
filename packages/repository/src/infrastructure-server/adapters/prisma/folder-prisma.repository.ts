/**
 * Folder Prisma Repository
 *
 * Prisma implementation of IFolderRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import { Folder, type FolderState } from '../../../domain-server/entities/folder';
import { ResourceId } from '../../../domain-shared/value-objects/resource-id';
import { FolderMetadata } from '../../../domain-shared/value-objects/folder-metadata';
import type { FolderMetadataDTO } from '@dailyuse/contracts/repository';

function parseMetadata(value: unknown): FolderMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return FolderMetadata.createDefault();
  }
  return FolderMetadata.fromDTO(value as FolderMetadataDTO);
}

function mapToDomain(data: any): Folder {
  const state: FolderState = {
    id: ResourceId.of(data.id),
    repositoryId: data.repositoryId,
    identityId: data.identityId,
    parentId: data.parentId,
    name: data.name,
    path: data.path,
    order: data.order,
    isExpanded: data.isExpanded,
    metadata: parseMetadata(data.metadata),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    children: null,
  };

  return Folder.load(state);
}

/**
 * Folder Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class FolderPrismaRepository implements IFolderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(folder: Folder): Promise<void> {
    const dto = folder.toServerDTO();

    await this.prisma.folder.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        repositoryId: dto.repositoryId,
        identityId: dto.identityId,
        parentId: dto.parentId,
        name: dto.name,
        path: dto.path,
        order: dto.order,
        isExpanded: dto.isExpanded,
        metadata: JSON.parse(JSON.stringify(dto.metadata)) as Prisma.InputJsonValue,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        repositoryId: dto.repositoryId,
        parentId: dto.parentId,
        name: dto.name,
        path: dto.path,
        order: dto.order,
        isExpanded: dto.isExpanded,
        metadata: JSON.parse(JSON.stringify(dto.metadata)) as Prisma.InputJsonValue,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async findById(id: string): Promise<Folder | null> {
    const data = await this.prisma.folder.findUnique({ where: { id } });
    return data ? mapToDomain(data) : null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    const rows = await this.prisma.folder.findMany({
      where: { repositoryId },
      orderBy: { path: 'asc' },
    });
    return rows.map(mapToDomain);
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    const rows = await this.prisma.folder.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapToDomain);
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    const rows = await this.prisma.folder.findMany({
      where: { repositoryId, parentId: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapToDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.folder.delete({ where: { id } });
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.prisma.folder.deleteMany({ where: { repositoryId } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.folder.count({ where: { id } });
    return count > 0;
  }
}
