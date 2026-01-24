import type { 
  IRepositoryRepository, 
  IResourceRepository, 
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

/**
 * Repository 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 * 璐熻矗绠＄悊棰嗗煙鏈嶅姟鍜屼粨鍌ㄧ殑瀹炰緥Create鍜岀敓鍛藉懆鏈?
 *
 * 璁捐鍘熷垯锛堟敼杩涚増锛夛細
 * 1. 鏀寔澶氭暟鎹簱鎻愪緵鑰咃紙Prisma銆丼QLite銆丮emory 绛夛級
 * 2. 鏀寔鍔ㄦ€佹敞鍐屽疄鐜帮紙涓嶅啀渚濊禆纭紪鐮佺殑 Prisma锛?
 * 3. 鏀寔娴嬭瘯鏇挎崲锛圡ock Repository锛?
 * 4. 鏀寔鎳掑姞杞斤紙棣栨璋冪敤鏃跺垱寤猴級
 * 5. 鏀寔閲嶇疆锛堢敤浜庢祴璇曪級
 *
 * 浣跨敤鍦烘櫙锛?
 * - API 椤圭洰锛氶€氳繃 DatabaseProviderFactory 娉ㄥ唽 Prisma 瀹炵幇
 * - Desktop 椤圭洰锛氶€氳繃 DatabaseProviderFactory 娉ㄥ唽 SQLite 瀹炵幇
 * - 娴嬭瘯锛氱洿鎺ユ敞鍏?Mock 瀹炵幇
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository?: IRepositoryRepository;
  private resourceRepository?: IResourceRepository;
  private folderRepository?: IFolderRepository;
  private repositoryStatisticsRepository?: IRepositoryStatisticsRepository;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 閲嶇疆鍗曚緥锛堢敤浜庡垏鎹㈡彁渚涜€呮垨娴嬭瘯锛?
   */
  static resetInstance(): void {
    RepositoryContainer.instance = new RepositoryContainer();
  }

  // ===== Repository Repository =====

  /**
   * 娉ㄥ唽 Repository Repository瀹炵幇
   */
  registerRepositoryRepository(repository: IRepositoryRepository): this {
    this.repositoryRepository = repository;
    return this;
  }

  /**
   * Get Repository Repository瀹炰緥
   */
  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      throw new Error(
        'Repository repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.repositoryRepository;
  }

  // ===== Resource Repository =====

  /**
   * 娉ㄥ唽 Resource Repository瀹炵幇
   */
  registerResourceRepository(repository: IResourceRepository): this {
    this.resourceRepository = repository;
    return this;
  }

  /**
   * Get Resource Repository瀹炰緥
   */
  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      throw new Error(
        'Resource repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.resourceRepository;
  }

  // ===== Folder Repository =====

  /**
   * 娉ㄥ唽 Folder Repository瀹炵幇
   */
  registerFolderRepository(repository: IFolderRepository): this {
    this.folderRepository = repository;
    return this;
  }

  /**
   * Get Folder Repository瀹炰緥
   */
  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      throw new Error(
        'Folder repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.folderRepository;
  }

  // ===== Repository Statistics Repository =====

  /**
   * 娉ㄥ唽 RepositoryStatistics Repository瀹炵幇
   */
  registerRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): this {
    this.repositoryStatisticsRepository = repository;
    return this;
  }

  /**
   * Get RepositoryStatistics Repository瀹炰緥
   */
  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error(
        'Repository statistics repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.repositoryStatisticsRepository;
  }

  // ===== 鍒悕鏂规硶锛堝吋瀹规€э級 =====

  /**
   * Get Repository 鑱氬悎Repository瀹炰緥锛堝埆鍚嶏級
   */
  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }

  // ===== 宸ュ叿鏂规硶 =====

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曟垨鍒囨崲鎻愪緵鑰咃級
   */
  reset(): void {
    this.repositoryRepository = undefined;
    this.resourceRepository = undefined;
    this.folderRepository = undefined;
    this.repositoryStatisticsRepository = undefined;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡鍒濆鍖?
   */
  isInitialized(): boolean {
    return !!(
      this.repositoryRepository &&
      this.resourceRepository &&
      this.folderRepository &&
      this.repositoryStatisticsRepository
    );
  }

  /**
   * 妫€鏌ユ槸鍚﹂儴鍒嗗垵濮嬪寲
   */
  isPartiallyInitialized(): boolean {
    return !!(
      this.repositoryRepository ||
      this.resourceRepository ||
      this.folderRepository ||
      this.repositoryStatisticsRepository
    );
  }
}
