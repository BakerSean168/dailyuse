/**
 * SkipRecord Value Object - Server Interface
 * 跳过记录值对�?- 服务端接�?
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { SkipRecordClientDTO } from './skip-record-client';

// ============ 接口定义 ============

export interface SkipRecordServer {
  skippedAt: DomainDate;
  reason: string | null;

  equals(other: SkipRecordServer): boolean;
}

// ============ DTO 定义 ============

export interface SkipRecordServerDTO {
  skippedAt: TransferDate;
  reason: string | null;
}

export interface SkipRecordPersistenceDTO {
  skippedAt: PersistenceDate;
  reason: string | null;
}
