import { AggregateRoot } from '@dailyuse/utils';
import type { 
  AuthSessionClientDTO, 
  AuthSessionClient as IAuthSessionClient,
  DeviceInfo as IDeviceInfo
} from '@dailyuse/contracts/authentication';
import { AuthSessionId, DeviceInfo, DeviceType } from '@dailyuse/domain-shared/authentication';

/**
 * 📱 认证会话聚合根 - 客户端
 * 
 * Client 端看到的会话是脱敏的：
 * - 不包含 Token 本体
 * - 显示用户友好的会话列表（当前设备、其他设备）
 */
export class AuthSession extends AggregateRoot<AuthSessionId> implements IAuthSessionClient {
  // ================= 内部状态 =================
  private _identityId: string;
  private _deviceInfo: DeviceInfo;
  private _isCurrentSession: boolean;

  public readonly createdAt: Date;
  public readonly expiresAt: Date;
  public readonly lastActiveAt: Date;

  // ================= 构造函数 =================
  private constructor(dto: AuthSessionClientDTO) {
    super(AuthSessionId.of(dto.id));
    
    this._identityId = dto.identityId;
    this._deviceInfo = DeviceInfo.fromDTO(dto.deviceInfo);
    this._isCurrentSession = dto.isCurrentSession;
    
    this.createdAt = new Date(dto.createdAt);
    this.expiresAt = new Date(dto.expiresAt);
    this.lastActiveAt = new Date(dto.lastActiveAt);
  }

  // ================= 工厂方法 =================
  
  /**
   * 从 ClientDTO 创建聚合根
   */
  public static fromClientDTO(dto: AuthSessionClientDTO): AuthSession {
    return new AuthSession(dto);
  }

  // ================= Getters =================
  
  get identityId(): string {
    return this._identityId;
  }

  get deviceInfo(): IDeviceInfo {
    return this._deviceInfo.toDTO();
  }

  get isCurrentSession(): boolean {
    return this._isCurrentSession;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取设备信息值对象（非 DTO）
   */
  get device(): DeviceInfo {
    return this._deviceInfo;
  }

  /**
   * 获取设备显示名称
   */
  get deviceDisplayName(): string {
    return this._deviceInfo.getDisplayName();
  }

  /**
   * 获取设备类型显示名称
   */
  get deviceTypeDisplayName(): string {
    return DeviceType.getDisplayName(this._deviceInfo.deviceType);
  }

  /**
   * 获取操作系统和浏览器信息
   */
  get platformDescription(): string {
    const parts: string[] = [];
    if (this._deviceInfo.os) {
      parts.push(this._deviceInfo.os);
    }
    if (this._deviceInfo.browser) {
      parts.push(this._deviceInfo.browser);
    }
    return parts.join(' · ') || '未知平台';
  }

  /**
   * 会话是否已过期
   */
  get isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  /**
   * 会话剩余有效时间（毫秒）
   */
  get remainingTimeMs(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  /**
   * 会话剩余有效时间描述
   */
  get remainingTimeDescription(): string {
    if (this.isExpired) {
      return '已过期';
    }

    const remainingMs = this.remainingTimeMs;
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}天${hours}小时后过期`;
    }

    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}小时${minutes}分钟后过期`;
    }

    return `${minutes}分钟后过期`;
  }

  /**
   * 最后活跃时间相对描述
   */
  get lastActiveDescription(): string {
    const now = Date.now();
    const diffMs = now - this.lastActiveAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚活跃';
    if (diffMinutes < 60) return `${diffMinutes}分钟前活跃`;
    if (diffHours < 24) return `${diffHours}小时前活跃`;
    if (diffDays < 7) return `${diffDays}天前活跃`;
    return '超过一周未活跃';
  }

  /**
   * 会话是否近期活跃（5分钟内）
   */
  get isRecentlyActive(): boolean {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.lastActiveAt.getTime() > fiveMinutesAgo;
  }

  /**
   * 获取会话创建时间的格式化字符串
   */
  get createdAtFormatted(): string {
    return this.createdAt.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 是否可以撤销此会话
   * 当前会话也可以撤销（相当于登出）
   */
  get canRevoke(): boolean {
    return !this.isExpired;
  }

  /**
   * 获取会话标签
   * 例如: "当前设备", "其他设备", "已过期"
   */
  get sessionLabel(): string {
    if (this.isExpired) {
      return '已过期';
    }
    if (this._isCurrentSession) {
      return '当前设备';
    }
    return '其他设备';
  }

  /**
   * 获取会话标签样式类
   */
  get sessionLabelClass(): string {
    if (this.isExpired) {
      return 'label-expired';
    }
    if (this._isCurrentSession) {
      return 'label-current';
    }
    return 'label-other';
  }

  // ================= 不可变更新 =================

  /**
   * 克隆并更新（用于乐观更新）
   */
  public cloneWith(changes: Partial<AuthSessionClientDTO>): AuthSession {
    const currentDTO = this.toClientDTO();
    return new AuthSession({
      ...currentDTO,
      ...changes,
    });
  }

  // ================= 序列化 =================

  public toClientDTO(): AuthSessionClientDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      deviceInfo: this._deviceInfo.toDTO(),
      isCurrentSession: this._isCurrentSession,
      createdAt: this.createdAt.getTime(),
      expiresAt: this.expiresAt.getTime(),
      lastActiveAt: this.lastActiveAt.getTime(),
    };
  }
}
