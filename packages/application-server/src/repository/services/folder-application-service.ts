import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { Folder, FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, FolderClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Folder 应用服务
 * 负责文件夹（Folder）的 CRUD 操作
 *
 * 架构职责：
 * - 调用 Repository 进行持久化
 * - DTO 转换（Domain → ClientDTO）
 * - 协调业务用例
 * - 管理文件夹层次结构
 */
export class FolderApplicationService {
  private static instance: FolderApplicationService;
  private folderRepository: IFolderRepository;
  private hierarchyService: FolderHierarchyService;

  private constructor(folderRepository: IFolderRepository) {
    this.folderRepository = folderRepository;
    this.hierarchyService = new FolderHierarchyService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static createInstance(folderRepository?: IFolderRepository): FolderApplicationService {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();

    FolderApplicationService.instance = new FolderApplicationService(repo);
    return FolderApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): FolderApplicationService {
    if (!FolderApplicationService.instance) {
      FolderApplicationService.instance = FolderApplicationService.createInstance();
    }
    return FolderApplicationService.instance;
  }

  /**
   * 创建文件夹
   */
  async createFolder(params: {
    repositoryUuid: string;
    parentUuid?: string | null;
    name: string;
    order?: number;
    metadata?: Partial<FolderMetadataServerDTO>;
  }): Promise<FolderClientDTO> {
    // 1. 如果有父文件夹，查询父路径
    let parentPath: string | null = null;
    if (params.parentUuid) {
      const parent = await this.folderRepository.findByUuid(params.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${params.parentUuid}`);
      }
      parentPath = parent.path;
    }

    // 2. 创建领域实体
    const folder = Folder.create({
      repositoryUuid: params.repositoryUuid,
      parentUuid: params.parentUuid,
      name: params.name,
      parentPath,
      order: params.order,
      metadata: params.metadata,
    });

    // 3. 持久化
    await this.folderRepository.save(folder);

    // 4. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 获取文件夹详情
   */
  async getFolder(uuid: string): Promise<FolderClientDTO | null> {
    const folder = await this.folderRepository.findByUuid(uuid);
    return folder ? folder.toClientDTO() : null;
  }

  /**
   * 获取文件夹树（指定仓储）
   */
  async getFolderTree(repositoryUuid: string): Promise<FolderClientDTO[]> {
    // 1. 查询所有文件夹
    const allFolders = await this.folderRepository.findByRepositoryUuid(repositoryUuid);

    // 2. 构建树形结构
    const tree = this.hierarchyService.buildTree(allFolders);

    // 3. 转换 FolderTreeNode 为 ClientDTO（递归处理子节点）
    const convertTreeNode = (node: any): FolderClientDTO => {
      const folder = node.folder as Folder;
      const clientDTO = folder.toClientDTO(false); // 先不包含子节点

      // 递归转换子节点
      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child: any) => convertTreeNode(child));
      }

      return clientDTO;
    };

    return tree.map((node) => convertTreeNode(node));
  }

  /**
   * 重命名文件夹
   */
  async renameFolder(uuid: string, newName: string): Promise<FolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 重命名（领域方法会自动更新 path）
    folder.rename(newName);

    // 3. 持久化
    await this.folderRepository.save(folder);

    // 4. 级联更新子路径（使用正确的方法签名）
    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    // 5. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 移动文件夹
   */
  async moveFolder(
    uuid: string,
    newParentUuid: string | null,
  ): Promise<FolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 查询所有同仓储的文件夹
    const allFolders = await this.folderRepository.findByRepositoryUuid(folder.repositoryUuid);

    // 3. 循环检测 - await the async result
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

    // 4. 获取新父路径
    let newParentPath: string | null = null;
    if (newParentUuid) {
      const newParent = await this.folderRepository.findByUuid(newParentUuid);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${newParentUuid}`);
      }
      newParentPath = newParent.path;
    }

    // 5. 移动（领域方法）
    folder.moveTo(newParentUuid, newParentPath ?? undefined);

    // 6. 持久化
    await this.folderRepository.save(folder);

    // 7. 级联更新子路径（使用正确的方法签名）
    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    // 8. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 删除文件夹（级联）
   */
  async deleteFolder(uuid: string): Promise<void> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 收集所有要删除的文件夹UUID（包括子文件夹）
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

    // 3. 级联删除（从叶子节点开始，reverse 顺序）
    for (const folderUuid of uuidsToDelete.reverse()) {
      await this.folderRepository.delete(folderUuid);
    }
  }
}


