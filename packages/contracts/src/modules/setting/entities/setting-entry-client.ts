/**
 * Setting Aggregate Root - Client
 * 设置聚合根 - 客户端
 * 
 * 客户端设置包含：
 * 1. 云端同步的用户偏好设置 (User Settings)
 * 2. 本地设备配置 (Device Settings)
 */
import type { TransferDate, SettingEntryId, DomainDate } from '@/primitives';
import { SettingCategory } from '../value-objects';

export interface SettingEntryClient {
  id: SettingEntryId;
  key: string;
  value: any;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

export interface SettingEntryClientDTO {
  id: string;
  key: string;
  value: any;
  category: SettingCategory;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}