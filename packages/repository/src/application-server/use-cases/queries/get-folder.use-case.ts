/**
 * Get Folder
 *
 * Get folder detail
 */

import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Folder Input
 */
export interface GetFolderInput {
  id: string;
}

/**
 * Get Folder Output
 */
export interface GetFolderOutput {
  folder: FolderClientDTO | null;
}

/**
 * Get Folder Use Case
 */
export class GetFolderUseCase {

  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(input: GetFolderInput): Promise<Result<GetFolderOutput>> {
    const folder = await this.folderRepository.findById(input.id);
    return ok({ folder: folder ? folder.toClientDTO() as unknown as FolderClientDTO : null });
  }
}
