/**
 * Repository Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Repository module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockRepository, createMockResource } from '@dailyuse/contracts/mocks';
 * const repo = createMockRepository();
 * const resource = createMockResource();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { RepositoryClientDTO } from '../modules/repository/aggregates/repository-client';
import type { ResourceClientDTO } from '../modules/repository/aggregates/resource-client';
import type { RepositoryId, IdentityId } from '../primitives/ids';

export function createMockRepository(
  overrides: Partial<RepositoryClientDTO> = {},
): RepositoryClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();
  const status = faker.helpers.arrayElement(['Active', 'Archived', 'Syncing', 'Error']);

  return {
    id: id as RepositoryId,
    identityId: faker.string.uuid() as IdentityId,
    name: faker.helpers.arrayElement(['工作笔记', '个人项目', '学习资料', '代码仓库', '文档库']),
    type: faker.helpers.arrayElement(['Local', 'Git', 'Cloud', 'Hybrid']),
    path: faker.datatype.boolean() ? faker.system.directoryPath() : null,
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    config: {
      autoSync: faker.datatype.boolean(),
      syncInterval: faker.helpers.arrayElement([5, 15, 30, 60]),
      branch: faker.datatype.boolean()
        ? faker.helpers.arrayElement(['main', 'master', 'develop'])
        : null,
      remoteUrl: faker.datatype.boolean() ? faker.internet.url() : null,
    },
    stats: {
      totalFiles: faker.number.int({ min: 0, max: 1000 }),
      totalFolders: faker.number.int({ min: 0, max: 100 }),
      totalSize: faker.number.int({ min: 0, max: 10737418240 }),
      lastSyncAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 0, max: 86400000 })
        : null,
    },
    status,
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 90 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    isDeleted: false,
    isArchived: status === 'Archived',
    isActive: status === 'Active',
    folderCount: faker.number.int({ min: 0, max: 50 }),
    resourceCount: faker.number.int({ min: 0, max: 200 }),
    totalSize: faker.number.int({ min: 0, max: 10737418240 }),
    ...overrides,
  } as RepositoryClientDTO;
}

export function createMockResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();
  const type = faker.helpers.arrayElement(['File', 'Folder', 'Link', 'Note']);
  const size = type === 'Folder' ? 0 : faker.number.int({ min: 0, max: 10485760 });

  return {
    id,
    repositoryId: faker.string.uuid(),
    folderId: faker.datatype.boolean() ? faker.string.uuid() : null,
    name:
      type === 'Folder'
        ? faker.helpers.arrayElement(['文档', '笔记', '项目', '资料', '存档'])
        : faker.system.fileName(),
    type,
    mimeType:
      type === 'File'
        ? faker.helpers.arrayElement([
            'text/markdown',
            'application/json',
            'text/plain',
            'image/png',
          ])
        : 'inode/directory',
    path: faker.system.filePath(),
    size,
    content: type === 'Note' ? faker.lorem.paragraphs({ min: 1, max: 5 }) : null,
    metadata: {
      wordCount: type === 'Note' ? faker.number.int({ min: 50, max: 5000 }) : 0,
      lineCount: type === 'Note' ? faker.number.int({ min: 10, max: 500 }) : 0,
      lastModifiedBy: faker.person.fullName(),
    },
    stats: {
      viewCount: faker.number.int({ min: 0, max: 1000 }),
      editCount: faker.number.int({ min: 0, max: 100 }),
      lastViewedAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 0, max: 86400000 })
        : null,
    },
    status: faker.helpers.arrayElement(['Active', 'Draft', 'Archived', 'Deleted']),
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: faker.datatype.boolean({ probability: 0.1 }),
    isActive: true,
    isDraft: faker.datatype.boolean({ probability: 0.2 }),
    extension: type === 'File' ? faker.helpers.arrayElement(['.md', '.txt', '.json', '.png']) : '',
    icon: faker.helpers.arrayElement(['file', 'folder', 'link', 'note']),
    ...overrides,
  } as ResourceClientDTO;
}

export function createMockResourceList(
  count = 5,
  overrides: Partial<ResourceClientDTO> = {},
): ResourceClientDTO[] {
  return Array.from({ length: count }, () => createMockResource(overrides));
}
