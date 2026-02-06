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

// Import IdentityId from shared primitives (cross-module shared type)
import { IdentityId } from '@dailyuse/domain-shared/shared';

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

/** Props interface for Account */
interface AccountProps {
  profile: AccountProfile;
  email: ContactEmail;
  settings: AccountSettings;
  status: AccountStatus;
  phone: ContactPhone | null;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot<IdentityId> implements AccountServer {
  
  // ================= 1. 私有属性容器 =================
  private _props: AccountProps;

  // ================= 2. 构造函数 (Private) =================
  // 仅用于通过 Factory 还原或创建对象
  private constructor(props: AccountServerDTO) {
    super(IdentityId.of(props.id)); // 使用值对象还原 ID
    
    this._props = {
      profile: AccountProfile.create(props.profile),
      email: ContactEmail.create(props.email),
      settings: AccountSettings.create(props.settings),
      status: AccountStatus.of(props.status),
      phone: props.phone ? ContactPhone.create(props.phone) : null,
      version: props.version,
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }

  // ================= 3. 公共属性 (Getters) =================
  get profile(): AccountProfile {
    return this._props.profile;
  }
  get email(): ContactEmail {
    return this._props.email;
  }
  get settings(): AccountSettings {
    return this._props.settings;
  }
  get status(): AccountStatus {
    return this._props.status;
  }
  get phone(): ContactPhone | null {
    return this._props.phone;
  }

  get version(): number { return this._props.version; }
  get deletedAt(): Date | null { return this._props.deletedAt; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建一个全新的账号
   * 职责：生成初始状态、默认值、应用创建时的业务规则
   */
  public static create(params: {
    id: IdentityId,
    email: string;
  }): Account {
    const now = Date.now();
    const dto: AccountServerDTO = {
      id: params.id.toString(),
      status: AccountStatus.ACTIVE,
      profile: AccountProfile.createDefault(params.email).toDTO(),
      settings: AccountSettings.createDefault().toDTO(),
      email: {
        address: params.email,
        isVerified: false,
        verifiedAt: null,
        isPrimary: true,
      },
      phone: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const account = new Account(dto);

    account.addDomainEvent<AccountEventMap['account:create']>('account:create', {
      identityId: params.id.toString(),
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
      version: dto.version,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt ? dto.deletedAt.getTime() : null,
    };
    return new Account(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================
  
  // 辅助方法：刷新更新时间
  private refreshUpdatedAt(): void {
    this._props.updatedAt = new Date();
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
    if (this._props.status === AccountStatus.DEACTIVATED) {
      // 幂等性设计：如果已经注销了，直接返回，或者抛错
      // return; 
      throw new Error("Account is already closed.");
    }

    if (this._props.status === AccountStatus.SUSPENDED) {
      throw new Error("Cannot close a suspended account. Please contact support.");
    }

    // 2. 执行状态变更
    this._props.status = AccountStatus.DEACTIVATED;
    
    // 3. (可选) 隐私合规操作 (GDPR - Right to be forgotten)
    // 注销时是否要抹除个人信息？
    // this._props.profile = this._props.profile.anonymize(); 
    // this._props.email = this._props.email.mask();

    // 4. 更新时间
    this.refreshUpdatedAt();

    // 5. 【关键】发出领域事件
    // 聚合根只负责管好自己，但它需要通知全世界：“我注销了！”
    // Auth 模块监听到这个事件后，会吊销该用户的登录 Token
    this.addDomainEvent<AccountEventMap['account:close']>('account:close', {
      reason: 'User initiated closure'
    });
  }

  // ================= 6. 序列化 (Serialization) =================

  // DTO conversion
  public toServerDTO(): AccountServerDTO {
    return {
      id: this.id,
      status: this._props.status,
      profile: this._props.profile.toDTO(),
      settings: this._props.settings.toDTO(),
      email: this._props.email.toDTO(),
      phone: this._props.phone ? this._props.phone.toDTO() : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  public toPersistenceDTO(): AccountPersistenceDTO {
    return {
      id: this.id,
      status: this._props.status,
      profile: this._props.profile.toPersistenceDTO(),
      settings: this._props.settings.toPersistenceDTO(),
      email: this._props.email.toPersistenceDTO(),
      phone: this._props.phone ? this._props.phone.toPersistenceDTO() : null,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt,
    }
  }
}
