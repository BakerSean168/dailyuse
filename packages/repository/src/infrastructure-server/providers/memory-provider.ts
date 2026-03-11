/**
 * Memory Provider Initializer
 *
 * 涓哄唴瀛樻暟鎹簱鎻愪緵鑰呭垵濮嬪寲All鏈変粨鍌ㄥ疄鐜帮紙鐢ㄤ簬娴嬭瘯锛?
 */

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';

import { RepositoryMemoryRepository } from '../adapters/memory/repository-memory.repository';
import { ResourceMemoryRepository } from '../adapters/memory/resource-memory.repository';
import { FolderMemoryRepository } from '../adapters/memory/folder-memory.repository';

import type { IProviderInitContext, IProviderInitializer } from '../database-provider-factory';

/**
 * Memory 鎻愪緵鑰呭垵濮嬪寲鍣?
 *
 * 鑱岃矗锛?
 * - CreateAll鏈?Memory Repository瀹炵幇
 * - 灏嗗疄鐜版敞鍐屽埌瀹瑰櫒涓?
 * - 涓昏鐢ㄤ簬鍗曞厓娴嬭瘯
 */
export class MemoryProviderInitializer implements IProviderInitializer {
  async initialize(context: IProviderInitContext): Promise<void> {
    const { container } = context;

    // CreateAll鏈?Memory Repository瀹炵幇
    const repositoryRepository: IRepositoryRepository = new RepositoryMemoryRepository();
    const resourceRepository: IResourceRepository = new ResourceMemoryRepository();
    const folderRepository: IFolderRepository = new FolderMemoryRepository();

    // 娉ㄥ唽鍒板鍣?
    container.registerRepositoryRepository(repositoryRepository);
    container.registerResourceRepository(resourceRepository);
    container.registerFolderRepository(folderRepository);

    console.log('鉁?Memory provider initialized successfully (testing mode)');
  }

  async cleanup(): Promise<void> {
    console.log('鉁?Memory provider cleaned up');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
