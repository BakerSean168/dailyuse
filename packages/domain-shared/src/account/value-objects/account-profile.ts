import { ValueObject } from '@dailyuse/utils';
import type { AccountProfileDTO, AccountProfilePersistenceDTO, AccountProfile as IAccountProfile } from '@dailyuse/contracts/account';
import type { DomainDate } from '@dailyuse/contracts/primitives';
import { GenderType } from './gender-type';

export class AccountProfile extends ValueObject<AccountProfileDTO> implements IAccountProfile {

  private constructor(props: AccountProfileDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: AccountProfileDTO): AccountProfile {
    this.validate(props);
    return new AccountProfile(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 场景: 用户注册时，生成默认的 Profile
   */
  public static createDefault(email: string): AccountProfile {
    // 逻辑下沉: 默认昵称生成规则在这里
    const defaultNickname = email.split('@')[0].slice(0, 10);
    
    return new AccountProfile({
      nickname: defaultNickname,
      gender: GenderType.PREFER_NOT_TO_SAY,
      realName: null,
      avatarUrl: null,
      bio: null,
      birthday: null 
    });
  }

  // ================= 内部逻辑 =================

  /**
   * 集中校验逻辑
   */
  private static validate(props: AccountProfileDTO): void {
    if (props.nickname.length > 20) {
      throw new Error("Nickname must be under 20 characters");
    }
    if (props.nickname.length < 2) {
       throw new Error("Nickname must be at least 2 characters");
    }
    // 校验枚举值有效性
    GenderType.of(props.gender); 
  }

  // ================= 行为 (不可变变更) =================
  // 所有的 Update 必须返回新的实例 (Immutability)

  public updateNickname(nickname: string): AccountProfile {
    const newProps = { ...this.props, nickname };
    AccountProfile.validate(newProps); // 👈 变更时也必须校验
    return new AccountProfile(newProps);
  }

  public updateAvatar(avatarUrl: string): AccountProfile {
    return new AccountProfile({ ...this.props, avatarUrl });
  }

  public updateBio(bio: string): AccountProfile {
    // 可以加长度校验
    if (bio.length > 500) throw new Error("Bio too long");
    return new AccountProfile({ ...this.props, bio });
  }

  public setRealName(realName: string): AccountProfile {
    return new AccountProfile({ ...this.props, realName });
  }

  public updateGender(gender: GenderType): AccountProfile {
    return new AccountProfile({ ...this.props, gender });
  }

  public setBirthday(birthday: number): AccountProfile {
    // 可以加日期合理性校验（比如不能是未来）
    if (birthday > Date.now()) throw new Error("Birthday cannot be in the future");
    return new AccountProfile({ ...this.props, birthday });
  }

  // ================= 计算属性 (Rich Logic) =================

  public getAge(): number | null {
    if (!this.props.birthday) return null;
    const birthDate = new Date(this.props.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * 获取显示名称（优先实名，否则昵称）
   */
  public get displayName(): string {
    return this.props.realName || this.props.nickname;
  }

  // ================= Getters =================
  // 直接暴露 props 中的原始值，或者返回强类型对象

  get nickname(): string { return this.props.nickname; }
  get realName(): string | null { return this.props.realName; }
  get avatarUrl(): string | null { return this.props.avatarUrl; }
  get bio(): string | null { return this.props.bio; }
  get gender(): GenderType { return GenderType.of(this.props.gender); }
  get birthday(): DomainDate | null {
    return this.props.birthday ? new Date(this.props.birthday) : null;
  }

  // ================= 序列化 (Serialization) =================

  /**
   * 从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: AccountProfilePersistenceDTO): AccountProfile {
    return new AccountProfile({
      nickname: dto.nickname,
      realName: dto.realName,
      avatarUrl: dto.avatarUrl,
      bio: dto.bio,
      gender: GenderType.of(dto.gender),
      birthday: dto.birthday ? new Date(dto.birthday).getTime() : null
    });
  }

  /**
   * 转换为持久化格式
   * 职责: 处理 Date -> timestamp 转换，便于数据库存储
   */
  public toPersistenceDTO(): AccountProfilePersistenceDTO {
    return {
      nickname: this.props.nickname,
      realName: this.props.realName,
      avatarUrl: this.props.avatarUrl,
      bio: this.props.bio,
      gender: this.props.gender,
      birthday: this.props.birthday ? new Date(this.props.birthday) : null
    };
  }

  public toDTO(): AccountProfileDTO {
    return { ...this.props };
  }
}