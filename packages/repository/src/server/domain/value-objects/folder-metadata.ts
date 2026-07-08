/**
 * FolderMetadata 值对象
 * 
 * 文件夹元数据：图标、颜色等
 * 不可变性（所有修改返回新实例）
 * 
 * 注意：由于 IFolderMetadata 接口包含索引签名 [key: string]: unknown，
 * TypeScript 类无法直接实现。此类提供相同的属性和方法。
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  FolderMetadataDTO,
} from '@dailyuse/contracts/repository';

/**
 * FolderMetadata 值对象实现
 */
export class FolderMetadata extends ValueObject<FolderMetadataDTO> {

  private static readonly DEFAULT_ICON = 'folder';
  private static readonly DEFAULT_COLOR = '#6B7280';

  private constructor(props: FolderMetadataDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: FolderMetadataDTO): FolderMetadata {
    return new FolderMetadata(props);
  }

  public static createDefault(): FolderMetadata {
    return new FolderMetadata({});
  }

  public static fromDTO(dto: FolderMetadataDTO): FolderMetadata {
    return new FolderMetadata(dto);
  }

  // ================= Getters =================

  public get icon(): string | undefined {
    return this.props.icon;
  }

  public get color(): string | undefined {
    return this.props.color;
  }

  // ================= 行为方法 =================

  public setIcon(icon: string | undefined): FolderMetadata {
    return new FolderMetadata({ ...this.props, icon });
  }

  public setColor(color: string | undefined): FolderMetadata {
    return new FolderMetadata({ ...this.props, color });
  }

  // ================= 计算属性 =================

  public get hasIcon(): boolean {
    return this.props.icon !== undefined && this.props.icon.length > 0;
  }

  public get hasColor(): boolean {
    return this.props.color !== undefined && this.props.color.length > 0;
  }

  public get displayIcon(): string {
    return this.props.icon || FolderMetadata.DEFAULT_ICON;
  }

  public get displayColor(): string {
    return this.props.color || FolderMetadata.DEFAULT_COLOR;
  }

  // ================= 序列化 =================

  public toDTO(): FolderMetadataDTO {
    return { ...this.props };
  }
}
