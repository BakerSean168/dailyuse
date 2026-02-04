/**
 * RepositoryConfig 值对象
 * 
 * 仓储配置：搜索引擎、Git支持、同步设置
 * 不可变性（所有修改返回新实例）
 * 
 * 注意：由于 IRepositoryConfig 接口包含索引签名 [key: string]: unknown，
 * TypeScript 类无法直接实现。此类提供相同的属性和方法。
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  RepositoryConfigDTO,
} from '@dailyuse/contracts/repository';

/**
 * RepositoryConfig 值对象实现
 */
export class RepositoryConfig extends ValueObject<RepositoryConfigDTO> {

  private constructor(props: RepositoryConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: RepositoryConfigDTO): RepositoryConfig {
    return new RepositoryConfig(props);
  }

  public static createDefault(): RepositoryConfig {
    return new RepositoryConfig({
      searchEngine: 'postgres',
      enableGit: false,
      autoSync: false,
      syncInterval: 300, // 5分钟
    });
  }

  public static fromDTO(dto: RepositoryConfigDTO): RepositoryConfig {
    return new RepositoryConfig(dto);
  }

  // ================= Getters =================

  public get searchEngine(): 'postgres' | 'meilisearch' | 'elasticsearch' {
    return this.props.searchEngine;
  }

  public get enableGit(): boolean {
    return this.props.enableGit;
  }

  public get autoSync(): boolean | undefined {
    return this.props.autoSync;
  }

  public get syncInterval(): number | undefined {
    return this.props.syncInterval;
  }

  // ================= 行为方法 =================

  public setSearchEngine(engine: 'postgres' | 'meilisearch' | 'elasticsearch'): RepositoryConfig {
    return new RepositoryConfig({ ...this.props, searchEngine: engine });
  }

  public setGitEnabled(enabled: boolean): RepositoryConfig {
    return new RepositoryConfig({ ...this.props, enableGit: enabled });
  }

  public setAutoSync(enabled: boolean, interval?: number): RepositoryConfig {
    return new RepositoryConfig({
      ...this.props,
      autoSync: enabled,
      syncInterval: interval ?? this.props.syncInterval,
    });
  }

  // ================= 计算属性 =================

  public get searchEngineText(): string {
    const texts: Record<string, string> = {
      postgres: 'PostgreSQL',
      meilisearch: 'Meilisearch',
      elasticsearch: 'Elasticsearch',
    };
    return texts[this.props.searchEngine] || this.props.searchEngine;
  }

  public get gitStatusText(): string {
    return this.props.enableGit ? '已启用' : '未启用';
  }

  public get syncStatusText(): string {
    if (!this.props.autoSync) return '手动同步';
    const minutes = Math.floor((this.props.syncInterval ?? 300) / 60);
    return `每 ${minutes} 分钟`;
  }

  // ================= 序列化 =================

  public toDTO(): RepositoryConfigDTO {
    return { ...this.props };
  }
}
