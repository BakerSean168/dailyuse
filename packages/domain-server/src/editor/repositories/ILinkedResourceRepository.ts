/**
 * ILinkedResourceRepository
 * LinkedResource 实体仓储接口
 */

import type { LinkedResource } from '../entities/linked-resource';
import type { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';

/**
 * LinkedResource 仓储接口
 */
export interface ILinkedResourceRepository {
  /**
   * 根据 UUID 查找链接资源
   */
  findByUuid(uuid: string): Promise<LinkedResource | null>;

  /**
   * 根据源文档 UUID 查找所有链接资源
   */
  findBySourceDocumentUuid(sourceDocumentUuid: string): Promise<LinkedResource[]>;

  /**
   * 根据目标文档 UUID 查找所有链接资源（反向查找）
   */
  findByTargetDocumentUuid(targetDocumentUuid: string): Promise<LinkedResource[]>;

  /**
   * 根据源类型查找链接资源
   */
  findBySourceType(
    sourceDocumentUuid: string,
    sourceType: LinkedSourceType,
  ): Promise<LinkedResource[]>;

  /**
   * 根据目标类型查找链接资源
   */
  findByTargetType(
    sourceDocumentUuid: string,
    targetType: LinkedTargetType,
  ): Promise<LinkedResource[]>;

  /**
   * 查找无效的链接资源
   */
  findInvalid(workspaceUuid: string): Promise<LinkedResource[]>;

  /**
   * 查找需要验证的链接资源（超过指定阈值未验证）
   */
  findNeedingValidation(threshold: number): Promise<LinkedResource[]>;

  /**
   * 保存链接资源
   */
  save(resource: LinkedResource): Promise<void>;

  /**
   * 删除链接资源
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存链接资源
   */
  saveBatch(resources: LinkedResource[]): Promise<void>;

  /**
   * 删除源文档的所有链接资源
   */
  deleteBySourceDocumentUuid(sourceDocumentUuid: string): Promise<void>;

  /**
   * 删除目标文档的所有链接资源（当文档被删除时）
   */
  deleteByTargetDocumentUuid(targetDocumentUuid: string): Promise<void>;

  /**
   * 统计源文档的链接资源数量
   */
  countBySourceDocumentUuid(sourceDocumentUuid: string): Promise<number>;

  /**
   * 统计无效链接数量
   */
  countInvalid(workspaceUuid: string): Promise<number>;
}
