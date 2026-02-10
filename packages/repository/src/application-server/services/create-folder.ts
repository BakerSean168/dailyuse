/**
 * Create Folder
 *
 * Create folder
 */

import type { IFolderRepository } from '@/domain-server';
import { Folder } from '@/domain-server';
import type { FolderClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';

/**
 * Create Folder Input
 */
export interface CreateFolderInput {
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  order?: number;
  metadata?: Partial<FolderMetadataServerDTO>;
}

/**
 * Create Folder Output
 */
export interface CreateFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Create Folder
 */
export class CreateFolder {

  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    let parentPath: string | null = null;
    if (input.parentUuid) {
      const parent = await this.folderRepository.findByUuid(input.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${input.parentUuid}`);
      }
      parentPath = parent.path;
    }

    const folder = Folder.create({
      repositoryUuid: input.repositoryUuid,
      parentUuid: input.parentUuid,
      name: input.name,
      parentPath,
      order: input.order,
      metadata: input.metadata,
    });

    await this.folderRepository.save(folder);
    return { folder: folder.toClientDTO() };
  }
}

