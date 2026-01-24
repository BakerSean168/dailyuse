/**
 * Database Provider Factory
 *
 * 鏀寔澶氭暟鎹簱閫傞厤鐨勫伐鍘傜被锛屽厑璁稿湪杩愯鏃跺垏鎹㈡暟鎹簱瀹炵幇銆?
 * 閲囩敤绛栫暐妯″紡锛屼负涓嶅悓鐨勬暟鎹簱锛圥risma銆丼QLite銆丮ySQL绛夛級鎻愪緵缁熶竴鐨勪粨鍌ㄥ疄鐜般€?
 *
 * 浣跨敤鍦烘櫙锛?
 * - API 椤圭洰浣跨敤 Prisma锛圥ostgreSQL锛?
 * - Desktop 椤圭洰浣跨敤 SQLite
 * - Web 鍓嶇浣跨敤 IndexedDB锛堟湭鏉ワ級
 */

import type { RepositoryContainer } from './di/repository-container-v2';
import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

/**
 * 鏀寔鐨勬暟鎹簱鎻愪緵鑰呯被鍨?
 */
export enum DatabaseProvider {
  PRISMA = 'prisma',
  SQLITE = 'sqlite',
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  MEMORY = 'memory',
}

/**
 * 鏁版嵁搴撴彁渚涜€呴厤缃?
 */
export interface IDatabaseProviderConfig {
  provider: DatabaseProvider | string;
  /** Prisma 瀹炰緥锛堝綋浣跨敤 Prisma 鏃讹級 */
  prisma?: any;
  /** SQLite 鏁版嵁搴撹矾寰勶紙褰撲娇鐢?SQLite 鏃讹級 */
  sqliteDbPath?: string;
  /** SQLite 鏁版嵁搴撹繛鎺ュ疄渚嬶紙褰撳凡Create鏃讹級 */
  sqliteDb?: any;
  /** 鍏朵粬鑷畾涔夐厤缃?*/
  [key: string]: any;
}

/**
 * 鎻愪緵鑰呭垵濮嬪寲涓婁笅鏂?
 */
export interface IProviderInitContext {
  config: IDatabaseProviderConfig;
  container: any; // RepositoryContainer 鐨勭被鍨嬶紝閬垮厤寰幆渚濊禆
}

/**
 * 鏁版嵁搴撴彁渚涜€呭垵濮嬪寲鍣ㄦ帴鍙?
 */
export interface IProviderInitializer {
  /**
   * 鍒濆鍖栨彁渚涜€呭苟娉ㄥ唽All鏈変粨鍌ㄥ疄鐜?
   */
  initialize(context: IProviderInitContext): Promise<void>;

  /**
   * 娓呯悊Resource锛堝鍏抽棴杩炴帴锛?
   */
  cleanup(): Promise<void>;

  /**
   * 妫€鏌ユ彁渚涜€呭仴搴风姸鎬?
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 鍐呯疆鎻愪緵鑰呭垵濮嬪寲鍣?
 */
export const builtInInitializers: Record<string, new () => IProviderInitializer> = {};

/**
 * 鏁版嵁搴撴彁渚涜€呭伐鍘?
 *
 * 鑱岃矗锛?
 * 1. 娉ㄥ唽鍜岀鐞嗘暟鎹簱鎻愪緵鑰呭垵濮嬪寲鍣?
 * 2. 鏍规嵁閰嶇疆鍒濆鍖栫浉搴旂殑鎻愪緵鑰?
 * 3. 绠＄悊鎻愪緵鑰呯殑鐢熷懡鍛ㄦ湡
 */
export class DatabaseProviderFactory {
  private static initializers: Map<string, new () => IProviderInitializer> = new Map();
  private static instance: DatabaseProviderFactory;

  private constructor() {}

  /**
   * Get宸ュ巶鍗曚緥
   */
  static getInstance(): DatabaseProviderFactory {
    if (!DatabaseProviderFactory.instance) {
      DatabaseProviderFactory.instance = new DatabaseProviderFactory();
      DatabaseProviderFactory.registerBuiltInProviders();
    }
    return DatabaseProviderFactory.instance;
  }

  /**
   * 娉ㄥ唽鍐呯疆鎻愪緵鑰?
   */
  private static registerBuiltInProviders(): void {
    // Prisma 鎻愪緵鑰呭皢鍔ㄦ€佸鍏ヤ互閬垮厤寰幆渚濊禆
    DatabaseProviderFactory.registerProvider(
      DatabaseProvider.PRISMA,
      require('./providers/prisma-provider').PrismaProviderInitializer,
    );

    // SQLite 鎻愪緵鑰呭凡绉昏嚦 infrastructure-desktop 鍖?
    // 涓嶅湪姝ゅ娉ㄥ唽浠ラ伩鍏嶅惊鐜緷璧?
    // DatabaseProviderFactory.registerProvider(
    //   DatabaseProvider.SQLITE,
    //   require('./providers/sqlite-provider').SqliteProviderInitializer,
    // );

    // Memory 鎻愪緵鑰呯敤浜庢祴璇?
    DatabaseProviderFactory.registerProvider(
      DatabaseProvider.MEMORY,
      require('./providers/memory-provider').MemoryProviderInitializer,
    );
  }

  /**
   * 娉ㄥ唽鑷畾涔夋彁渚涜€呭垵濮嬪寲鍣?
   */
  static registerProvider(
    name: string,
    initializer: new () => IProviderInitializer,
  ): void {
    DatabaseProviderFactory.initializers.set(name, initializer);
  }

  /**
   * 鍒濆鍖栨暟鎹簱鎻愪緵鑰?
   *
   * @param config 鎻愪緵鑰呴厤缃?
   * @param container Repository瀹瑰櫒
   * @returns 鍒濆鍖栧悗鐨勬彁渚涜€呭垵濮嬪寲鍣ㄥ疄渚?
   * @throws 濡傛灉鎻愪緵鑰呬笉瀛樺湪
   */
  async initializeProvider(
    config: IDatabaseProviderConfig,
    container: RepositoryContainer,
  ): Promise<IProviderInitializer> {
    const providerName = config.provider;

    const InitializerClass = DatabaseProviderFactory.initializers.get(providerName);
    if (!InitializerClass) {
      throw new Error(
        `Unknown database provider: ${providerName}. ` +
          `Registered providers: ${Array.from(DatabaseProviderFactory.initializers.keys()).join(', ')}`,
      );
    }

    const initializer = new InitializerClass();

    try {
      await initializer.initialize({ config, container });
      return initializer;
    } catch (error) {
      console.error(`Failed to initialize database provider "${providerName}":`, error);
      throw error;
    }
  }

  /**
   * Get娉ㄥ唽鐨勬墍鏈夋彁渚涜€呭悕绉?
   */
  getRegisteredProviders(): string[] {
    return Array.from(DatabaseProviderFactory.initializers.keys());
  }

  /**
   * 妫€鏌ユ彁渚涜€呮槸鍚﹀凡娉ㄥ唽
   */
  hasProvider(name: string): boolean {
    return DatabaseProviderFactory.initializers.has(name);
  }
}

/**
 * 渚挎嵎鏂规硶锛氬垵濮嬪寲 API锛圥risma锛夌幆澧?
 */
export async function initializePrismaProvider(
  prismaClient: any,
  container: RepositoryContainer,
): Promise<IProviderInitializer> {
  const factory = DatabaseProviderFactory.getInstance();
  return factory.initializeProvider(
    {
      provider: DatabaseProvider.PRISMA,
      prisma: prismaClient,
    },
    container,
  );
}

/**
 * 渚挎嵎鏂规硶锛氬垵濮嬪寲 Desktop锛圫QLite锛夌幆澧?
 */
export async function initializeSqliteProvider(
  dbPath: string,
  container: RepositoryContainer,
): Promise<IProviderInitializer> {
  const factory = DatabaseProviderFactory.getInstance();
  return factory.initializeProvider(
    {
      provider: DatabaseProvider.SQLITE,
      sqliteDbPath: dbPath,
    },
    container,
  );
}
