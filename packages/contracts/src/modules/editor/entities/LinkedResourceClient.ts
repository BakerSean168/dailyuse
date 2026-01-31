/**
 * LinkedResource Entity - Client Interface
 * 链接资源实体 - 客户端接口
 */

import type { LinkedSourceType, LinkedTargetType } from '../enums';
import type { LinkedResourceServerDTO } from './LinkedResourceServer';

/**
 * Linked Resource Client DTO
 * 链接资源客户端 DTO（包含 UI 格式化字段）
 */
export interface LinkedResourceClientDTO {
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  sourceDocumentUuid: string;
  sourceType: LinkedSourceType;
  sourceLine?: number | null;
  sourceColumn?: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetDocumentUuid?: string | null;
  targetAnchor?: string | null;
  isValid: boolean;
  lastValidatedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化字段
  formattedLastValidated?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Linked Resource Entity - Client Interface
 * 链接资源实体 - 客户端接口
 */
export interface LinkedResourceClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly sourceDocumentUuid: string;
  readonly sourceType: LinkedSourceType;
  readonly sourceLine?: number | null;
  readonly sourceColumn?: number | null;
  readonly targetPath: string;
  readonly targetType: LinkedTargetType;
  readonly targetDocumentUuid?: string | null;
  readonly targetAnchor?: string | null;
  readonly isValid: boolean;
  readonly lastValidatedAt?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== UI 辅助方法 =====

  /**
   * 获取源类型标签
   */
  getSourceTypeLabel(): string;

  /**
   * 获取目标类型标签
   */
  getTargetTypeLabel(): string;

  /**
   * 获取目标类型图标名称
   */
  getTargetIconName(): string;

  /**
   * 获取链接状态标签
   */
  getValidStatusLabel(): string;

  /**
   * 获取链接状态颜色
   */
  getValidStatusColor(): string;

  /**
   * 是否为内部链接
   */
  isInternalLink(): boolean;

  /**
   * 是否为外部链接
   */
  isExternalLink(): boolean;

  /**
   * 是否有锚点
   */
  hasAnchor(): boolean;

  /**
   * 获取源位置文本（如 "Line 10, Col 5"）
   */
  getSourceLocationText(): string | null;

  /**
   * 获取格式化的最后验证时间
   */
  getFormattedLastValidated(): string | null;

  /**
   * 获取完整的目标 URL（包含锚点）
   */
  getFullTargetUrl(): string;

  // ===== DTO 转换方法 =====}
