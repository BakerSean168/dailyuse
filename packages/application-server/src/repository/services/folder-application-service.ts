import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { Folder, FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, FolderClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';

/**
 * Folder 搴旂敤鏈嶅姟
 * 璐熻矗鏂囦欢澶癸紙Folder锛夌殑 CRUD 鎿嶄綔
 *
 * 鏋舵瀯鑱岃矗锛?
 * - 璋冪敤 Repository 杩涜鎸佷箙鍖?
 * - DTO 杞崲锛圖omain 鈫?ClientDTO锛?
 * - Coordinate business logic
 * - 绠＄悊鏂囦欢澶瑰眰娆＄粨鏋?
 */
export class FolderApplicationService {
  private folderRepository: IFolderRepository;
  private hierarchyService: FolderHierarchyService;

  constructor(folderRepository: IFolderRepository) {
    this.folderRepository = folderRepository;
    this.hierarchyService = new FolderHierarchyService();
  }

  /**
   * Create folder
   */
  async createFolder(params: {
    repositoryUuid: string;
    parentUuid?: string | null;
    name: string;
    order?: number;
    metadata?: Partial<FolderMetadataServerDTO>;
  }): Promise<FolderClientDTO> {
    // 1. 濡傛灉鏈夌埗鏂囦欢澶癸紝鏌ヨ鐖惰矾寰?
    let parentPath: string | null = null;
    if (params.parentUuid) {
      const parent = await this.folderRepository.findByUuid(params.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${params.parentUuid}`);
      }
      parentPath = parent.path;
    }

    // 2. Create domain entity
    const folder = Folder.create({
      repositoryUuid: params.repositoryUuid,
      parentUuid: params.parentUuid,
      name: params.name,
      parentPath,
      order: params.order,
      metadata: params.metadata,
    });

    // 3. 鎸佷箙鍖?
    await this.folderRepository.save(folder);

    // 4. 杩斿洖 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * Get鏂囦欢澶硅鎯?
   */
  async getFolder(uuid: string): Promise<FolderClientDTO | null> {
    const folder = await this.folderRepository.findByUuid(uuid);
    return folder ? folder.toClientDTO() : null;
  }

  /**
   * Get folder tree锛堟寚瀹氫粨鍌級
   */
  async getFolderTree(repositoryUuid: string): Promise<FolderClientDTO[]> {
    // 1. 鏌ヨAll鏈夋枃浠跺す
    const allFolders = await this.folderRepository.findByRepositoryUuid(repositoryUuid);

    // 2. 鏋勫缓鏍戝舰缁撴瀯
    const tree = this.hierarchyService.buildTree(allFolders);

    // 3. 杞崲 FolderTreeNode 涓?ClientDTO锛堥€掑綊澶勭悊瀛愯妭鐐癸級
    const convertTreeNode = (node: any): FolderClientDTO => {
      const folder = node.folder as Folder;
      const clientDTO = folder.toClientDTO(false); // 鍏堜笉鍖呭惈瀛愯妭鐐?

      // 閫掑綊杞崲瀛愯妭鐐?
      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child: any) => convertTreeNode(child));
      }

      return clientDTO;
    };

    return tree.map((node) => convertTreeNode(node));
  }

  /**
   * 閲嶅懡鍚嶆枃浠跺す
   */
  async renameFolder(uuid: string, newName: string): Promise<FolderClientDTO> {
    // 1. 鏌ヨ鏂囦欢澶?
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 閲嶅懡鍚嶏紙棰嗗煙鏂规硶浼氳嚜鍔ㄦ洿鏂?path锛?
    folder.rename(newName);

    // 3. 鎸佷箙鍖?
    await this.folderRepository.save(folder);

    // 4. 绾ц仈Update瀛愯矾寰勶紙浣跨敤姝ｇ‘鐨勬柟娉曠鍚嶏級
    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    // 5. 杩斿洖 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 绉诲姩鏂囦欢澶?
   */
  async moveFolder(
    uuid: string,
    newParentUuid: string | null,
  ): Promise<FolderClientDTO> {
    // 1. 鏌ヨ鏂囦欢澶?
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 鏌ヨAll鏈夊悓Repository鐨勬枃浠跺す
    const allFolders = await this.folderRepository.findByRepositoryUuid(folder.repositoryUuid);

    // 3. 寰幆妫€娴?- await the async result
    if (newParentUuid) {
      const hasCycle = await this.hierarchyService.detectCycle(
        folder.uuid,
        newParentUuid,
        this.folderRepository,
      );
      if (hasCycle) {
        throw new Error('Circular reference detected');
      }
    }

    // 4. Get鏂扮埗璺緞
    let newParentPath: string | null = null;
    if (newParentUuid) {
      const newParent = await this.folderRepository.findByUuid(newParentUuid);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${newParentUuid}`);
      }
      newParentPath = newParent.path;
    }

    // 5. 绉诲姩锛堥鍩熸柟娉曪級
    folder.moveTo(newParentUuid, newParentPath ?? undefined);

    // 6. 鎸佷箙鍖?
    await this.folderRepository.save(folder);

    // 7. 绾ц仈Update瀛愯矾寰勶紙浣跨敤姝ｇ‘鐨勬柟娉曠鍚嶏級
    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    // 8. 杩斿洖 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * Delete鏂囦欢澶癸紙绾ц仈锛?
   */
  async deleteFolder(uuid: string): Promise<void> {
    // 1. 鏌ヨ鏂囦欢澶?
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 鏀堕泦All鏈夎Delete鐨勬枃浠跺すUUID锛堝寘鎷瓙鏂囦欢澶癸級
    const collectChildrenUuids = async (folderUuid: string): Promise<string[]> => {
      const uuids = [folderUuid];
      const children = await this.folderRepository.findByParentUuid(folderUuid);

      for (const child of children) {
        const childUuids = await collectChildrenUuids(child.uuid);
        uuids.push(...childUuids);
      }

      return uuids;
    };

    const uuidsToDelete = await collectChildrenUuids(uuid);

    // 3. 绾ц仈Delete锛堜粠鍙跺瓙鑺傜偣寮€濮嬶紝reverse 椤哄簭锛?
    for (const folderUuid of uuidsToDelete.reverse()) {
      await this.folderRepository.delete(folderUuid);
    }
  }
}



