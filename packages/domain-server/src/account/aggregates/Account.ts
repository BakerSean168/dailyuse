/**
 * Account 聚合根实现
 * 实现 AccountServer 接口
 */

import type {
  AccountClientDTO,
  AccountPersistenceDTO,
  AccountServer,
  AccountServerDTO,
} from '@dailyuse/contracts/account';
import { AggregateRoot } from '@dailyuse/utils';

import { IdentityId } from '@dailyuse/domain-shared/account';

import { 
  AccountProfile, 
  AccountSettings, 
  ContactEmail, 
  AccountStatus, 
  ContactPhone, 
  GenderType, 
  ThemeType 
} from '@dailyuse/domain-shared/account';

// 1. 引入 Contract 定义的类型，用于类型提示 (可选，但推荐)
import type { AccountEventMap } from '@dailyuse/contracts/account';

export class Account extends AggregateRoot<IdentityId> implements AccountServer {
  
  // ================= 1. 内部状态 (Backing Fields) =================
  // 命名习惯：加下划线 _ 表示私有 backing field
  private _profile: AccountProfile;
  private _email: ContactEmail;
  private _settings: AccountSettings;
  private _status: AccountStatus;
  private _phone: ContactPhone | null;

  // 使用私有字段存储，通过 getter 暴露，以便内部修改
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. 构造函数 (Private) =================
  // 仅用于通过 Factory 还原或创建对象
  private constructor(props: AccountServerDTO) {
    super(IdentityId.of(props.id)); // 使用值对象还原 ID
    
    this._profile = AccountProfile.create(props.profile);
    this._email = ContactEmail.create(props.email);
    this._settings = AccountSettings.create(props.settings);
    this._status = AccountStatus.of(props.status); // 假设 Status 有工厂方法
    this._phone = props.phone ? ContactPhone.create(props.phone) : null;
    
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. 公共属性 (Getters) =================
  get profile(): AccountProfile {
    return this._profile;
  }
  get email(): ContactEmail {
    return this._email;
  }
  get settings(): AccountSettings {
    return this._settings;
  }
  get status(): AccountStatus {
    return this._status;
  }
  get phone(): ContactPhone | null {
    return this._phone;
  }

  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建一个全新的账号
   * 职责：生成初始状态、默认值、应用创建时的业务规则
   */
  public static create(params: {
    id: IdentityId,
    email: string;
    nickname: string;
  }): Account {
    const now = Date.now();
    const dto: AccountServerDTO = {
      id: params.id.toString(),
      status: AccountStatus.ACTIVE,
      profile: {
        nickname: params.nickname,
        gender: GenderType.PREFER_NOT_TO_SAY,
        birthday: undefined,
        avatarUrl: undefined,
        bio: undefined,
        realName: undefined,
      },
      settings: {
        theme: ThemeType.SYSTEM,
        language: 'en-US',
        timezone: 'UTC',
        notificationEnabled: true,
      },
      email: {
        address: params.email,
        isVerified: false,
        isPrimary: true,
      },
      phone: null,
      createdAt: now,
      updatedAt: now,
    };
    const account = new Account(dto);

    account.addDomainEvent<AccountEventMap['account:created']>('account:created', {
      email: params.email,
      createdAt: now,
    });

    return account;
  }
        
  

  


  public static fromPersistenceDTO(dto: AccountPersistenceDTO): Account {
    const serverDTO: AccountServerDTO = {
      id: dto.id,
      status: dto.status,
      profile: AccountProfile.fromPersistenceDTO(dto.profile).toDTO(),
      settings: AccountSettings.fromPersistenceDTO(dto.settings).toDTO(),
      email: ContactEmail.fromPersistenceDTO(dto.email).toDTO(),
      phone: dto.phone ? ContactPhone.fromPersistenceDTO(dto.phone).toDTO() : null,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    };
    return new Account(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================
  
  // 辅助方法：刷新更新时间
  private refreshUpdatedAt(): void {
    this._updatedAt = new Date();
  }

  /**
   * ✅ 注销账户 (Business Action)
   * * 这是一个典型的“富领域模型”方法：
   * 1. 检查能不能注销
   * 2. 改变状态
   * 3. (可选) 清除敏感信息
   * 4. 发出通知 (Domain Event)
   */
  public close(): void {
    // 1. 检查内部一致性 (Invariants)
    if (this._status === AccountStatus.DEACTIVATED) {
      // 幂等性设计：如果已经注销了，直接返回，或者抛错
      // return; 
      throw new Error("Account is already closed.");
    }

    if (this._status === AccountStatus.SUSPENDED) {
      throw new Error("Cannot close a suspended account. Please contact support.");
    }

    // 2. 执行状态变更
    this._status = AccountStatus.DEACTIVATED;
    
    // 3. (可选) 隐私合规操作 (GDPR - Right to be forgotten)
    // 注销时是否要抹除个人信息？
    // this._profile = this._profile.anonymize(); 
    // this._email = this._email.mask();

    // 4. 更新时间
    this.refreshUpdatedAt();

    // 5. 【关键】发出领域事件
    // 聚合根只负责管好自己，但它需要通知全世界：“我注销了！”
    // Auth 模块监听到这个事件后，会吊销该用户的登录 Token
    this.addDomainEvent<AccountEventMap['account:closed']>('account:closed', {
      reason: 'User initiated closure'
    });
  }

  // ================= 6. 序列化 (Serialization) =================

  // DTO conversion
  public toServerDTO(): AccountServerDTO {
    return {
      id: this.id,
      status: this._status,
      profile: this._profile.toDTO(),
      settings: this._settings.toDTO(),
      email: this._email.toDTO(),
      phone: this._phone ? this._phone.toDTO() : null,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  public toPersistenceDTO(): AccountPersistenceDTO {
    return {
      id: this.id,
      status: this._status,
      profile: this._profile.toPersistenceDTO(),
      settings: this._settings.toPersistenceDTO(),
      email: this._email.toPersistenceDTO(),
      phone: this._phone ? this._phone.toPersistenceDTO() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
