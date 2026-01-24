/**
 * Get Folder
 *
 * 鑾峰彇鏂囦欢澶硅鎯?
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

/**
 * Get Folder Input
 */
export interface GetFolderInput {
  uuid: string;
}

/**
 * Get Folder Output
 */
export interface GetFolderOutput {
  folder: FolderClientDTO | null;
}

/**
 * Get Folder
 */
export class GetFolder {

  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(input: GetFolderInput): Promise<GetFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    return { folder: folder ? folder.toClientDTO() : null };
  }
}

