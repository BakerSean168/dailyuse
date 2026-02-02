/**
 * Setting Aggregate Root - Server
 * 设置聚合根 - 服务端
 * 
 * 核心职责：
 * 1. 管理用户的所有云端同步设置
 * 2. 验证设置值的合法性（使用 Registry）
 * 3. 发出设置变更事件
 * 4. 维护设置的版本历史
 */
import type { TransferDate, DomainDate, PersistenceDate, SettingEntryId } from '@/primitives';


/**
 * 设置聚合根的领域接口
 */
export interface SettingEntryServer {
  id: SettingEntryId;
  key: string;
  value: any;
  updatedAt: DomainDate;
}

export interface SettingEntryServerDTO {
  id: string;
  key: string;
  value: any;
  updatedAt: TransferDate;
}

export interface SettingEntryPersistenceDTO {
  id: string;
  key: string;
  value: any;
  updatedAt: PersistenceDate;
}