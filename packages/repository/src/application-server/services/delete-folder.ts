/**
 * Delete Folder
 *
 * Delete鏂囦欢澶癸紙绾ц仈锛?
 */

import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';

/**
 * Delete Folder Input
 */
export interface DeleteFolderInput {
  uuid: string;
}

/**
 * Delete Folder
 */
export class DeleteFolder {

  constructor(private readonly folderRepository: IFolderRepository) {}

  async execute(input: DeleteFolderInput): Promise<void> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    const collectChildrenUuids = async (folderUuid: string): Promise<string[]> => {
      const uuids = [folderUuid];
      const children = await this.folderRepository.findByParentUuid(folderUuid);

      for (const child of children) {
        const childUuids = await collectChildrenUuids(child.uuid);
        uuids.push(...childUuids);
      }

      return uuids;
    };

    const uuidsToDelete = await collectChildrenUuids(input.uuid);

    for (const folderUuid of uuidsToDelete.reverse()) {
      await this.folderRepository.delete(folderUuid);
    }
  }
}

