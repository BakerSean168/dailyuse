import { AggregateRoot } from '@dailyuse/utils';
import type { AccountClientDTO, AccountServerDTO } from '@dailyuse/contracts/account';
import { IdentityId } from '@dailyuse/domain-shared/account';

// ✅ 直接复用 Shared 里的值对象（包含校验和格式化逻辑）
import { 
  AccountProfile, 
  AccountSettings, 
  ContactEmail, 
  AccountStatus,
  ContactPhone 
} from '@dailyuse/domain-shared/account';

export class Account extends AggregateRoot<IdentityId> {
  // 内部状态
  private _profile: AccountProfile;
  private _email: ContactEmail;
  private _settings: AccountSettings;
  private _status: AccountStatus;
  private _phone: ContactPhone | null;

  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  // 构造函数：接收 ClientDTO (因为客户端的数据只来源 API)
  private constructor(props: AccountClientDTO) {
    super(IdentityId.of(props.id));
    
    // 还原值对象
    this._profile = AccountProfile.create(props.profile);
    this._email = ContactEmail.create(props.email);
    this._settings = AccountSettings.create(props.settings);
    this._status = AccountStatus.of(props.status);
    this._phone = props.phone ? ContactPhone.create(props.phone) : null;
    
    // 时间处理
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  // ============================================================
  // 1. 工厂方法 (客户端只需要从 API 恢复)
  // ============================================================
  
  public static fromClientDTO(dto: AccountClientDTO): Account {
    return new Account(dto);
  }

  // ❌ 客户端通常不需要 create() 工厂
  // 因为客户端创建账号是发起一个 API 请求 (Register)，
  // 而不是在本地内存里 new 一个对象然后保存。

  // ============================================================
  // 2. UI 辅助 Getters (ViewModel 逻辑)
  // ============================================================

  get profile() { return this._profile; }
  get email() { return this._email; }
  get settings() { return this._settings; }
  get status() { return this._status; }
  
  // ✨ 客户端特有的 UI 逻辑：头像回退机制
  get displayAvatar(): string {
    return this._profile.avatarUrl || 'assets/default-avatar.png';
  }

  // ✨ 客户端特有的 UI 逻辑：展示名称
  get displayName(): string {
    return this._profile.realName || this._profile.nickname || this._email.getMaskedAddress();
  }

  get isSuspended(): boolean {
    return this._status === AccountStatus.SUSPENDED;
  }

  // ============================================================
  // 3. 行为方法 (通常用于 乐观更新 / Clone)
  // ============================================================

  /**
   * 客户端的 clone 方法，用于 React/Vue 的不可变更新
   */
  public cloneWith(changes: Partial<AccountClientDTO>): Account {
    const currentDTO = this.toClientDTO();
    return new Account({
      ...currentDTO,
      ...changes
    });
  }

  // ============================================================
  // 4. 序列化 (用于传给组件或打印)
  // ============================================================

  public toClientDTO(): AccountClientDTO {
    return {
      id: this.id,
      status: this._status, // 假设 status 是 string
      profile: this._profile.toDTO(),
      settings: this._settings.toDTO(),
      email: this._email.toDTO(),
      phone: this._phone?.toDTO() ?? null,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}