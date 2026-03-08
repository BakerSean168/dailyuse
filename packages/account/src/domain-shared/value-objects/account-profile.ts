import { ValueObject } from '@dailyuse/utils';
import type {
  AccountProfileDTO,
  AccountProfilePersistenceDTO,
  AccountProfile as IAccountProfile,
} from '@dailyuse/contracts/account';
import type { DomainDate } from '@dailyuse/contracts/primitives';
import { GenderType } from './gender-type';

export class AccountProfile extends ValueObject<AccountProfileDTO> implements IAccountProfile {
  private constructor(props: AccountProfileDTO) {
    super(props);
  }

  public static create(props: AccountProfileDTO): AccountProfile {
    this.validate(props);
    return new AccountProfile(props);
  }

  public static createDefault(email: string): AccountProfile {
    const defaultNickname = email.split('@')[0].slice(0, 10);

    return new AccountProfile({
      nickname: defaultNickname,
      gender: GenderType.PreferNotToSay,
      realName: null,
      avatarUrl: null,
      bio: null,
      birthday: null,
    });
  }

  private static validate(props: AccountProfileDTO): void {
    if (props.nickname.length > 20) {
      throw new Error('Nickname must be under 20 characters');
    }
    if (props.nickname.length < 2) {
      throw new Error('Nickname must be at least 2 characters');
    }
    GenderType.of(props.gender);
  }

  public updateNickname(nickname: string): AccountProfile {
    const newProps = { ...this.props, nickname };
    AccountProfile.validate(newProps);
    return new AccountProfile(newProps);
  }

  public updateAvatar(avatarUrl: string): AccountProfile {
    return new AccountProfile({ ...this.props, avatarUrl });
  }

  public updateBio(bio: string): AccountProfile {
    if (bio.length > 500) throw new Error('Bio too long');
    return new AccountProfile({ ...this.props, bio });
  }

  public setRealName(realName: string): AccountProfile {
    return new AccountProfile({ ...this.props, realName });
  }

  public updateGender(gender: GenderType): AccountProfile {
    return new AccountProfile({ ...this.props, gender });
  }

  public setBirthday(birthday: number): AccountProfile {
    if (birthday > Date.now()) throw new Error('Birthday cannot be in the future');
    return new AccountProfile({ ...this.props, birthday });
  }

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

  public get displayName(): string {
    return this.props.realName || this.props.nickname;
  }

  get nickname(): string {
    return this.props.nickname;
  }
  get realName(): string | null {
    return this.props.realName;
  }
  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }
  get bio(): string | null {
    return this.props.bio;
  }
  get gender(): GenderType {
    return GenderType.of(this.props.gender);
  }
  get birthday(): DomainDate | null {
    return this.props.birthday ? new Date(this.props.birthday) : null;
  }

  public static fromPersistenceDTO(dto: AccountProfilePersistenceDTO): AccountProfile {
    return new AccountProfile({
      nickname: dto.nickname,
      realName: dto.realName,
      avatarUrl: dto.avatarUrl,
      bio: dto.bio,
      gender: GenderType.of(dto.gender),
      birthday: dto.birthday ? new Date(dto.birthday).getTime() : null,
    });
  }

  public toPersistenceDTO(): AccountProfilePersistenceDTO {
    return {
      nickname: this.props.nickname,
      realName: this.props.realName,
      avatarUrl: this.props.avatarUrl,
      bio: this.props.bio,
      gender: this.props.gender,
      birthday: this.props.birthday ? new Date(this.props.birthday) : null,
    };
  }

  public toDTO(): AccountProfileDTO {
    return { ...this.props };
  }
}
