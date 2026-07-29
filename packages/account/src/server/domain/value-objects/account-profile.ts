import { ValueObject } from '@memoflow/utils/domain';
import type {
  AccountProfileDTO,
  AccountProfile as IAccountProfile,
} from '@memoflow/contracts/account';
import type { Instant, Ymd } from '@memoflow/contracts/primitives';
import { createTimeFacade } from '@memoflow/time';
import { GenderType } from './gender-type';

const time = createTimeFacade();

function normalizeBirthday(value: AccountProfileDTO['birthday']): Ymd | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    return time.codec.parseYmd(value);
  }
  if (typeof value === 'number') {
    // Legacy epoch-ms birthday → local Ymd
    const instant = time.codec.fromTransfer(value);
    if (instant == null) return null;
    return time.codec.toYmd(instant);
  }
  return null;
}

function ymdToSortableInstant(ymd: Ymd): Instant {
  return time.codec.startOfYmd(ymd);
}

export class AccountProfile extends ValueObject<AccountProfileDTO> implements IAccountProfile {
  private constructor(props: AccountProfileDTO) {
    super(props);
  }

  public static create(props: AccountProfileDTO): AccountProfile {
    this.validate(props);
    const birthday = normalizeBirthday(props.birthday);
    return new AccountProfile({ ...props, birthday });
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

  /**
   * Set birthday from Ymd or legacy epoch ms.
   */
  public setBirthday(birthday: Ymd | Instant | string | number): AccountProfile {
    let ymd: Ymd | null = null;
    if (typeof birthday === 'string') {
      ymd = time.codec.parseYmd(birthday);
      if (!ymd) throw new Error('Invalid birthday Ymd');
    } else if (typeof birthday === 'number') {
      const instant = time.codec.fromTransfer(birthday);
      if (instant == null) throw new Error('Invalid birthday Instant');
      ymd = time.codec.toYmd(instant);
    }
    if (ymd == null) throw new Error('Invalid birthday');
    if (ymdToSortableInstant(ymd) > time.now()) {
      throw new Error('Birthday cannot be in the future');
    }
    return new AccountProfile({ ...this.props, birthday: ymd });
  }

  public getAge(): number | null {
    if (!this.props.birthday || typeof this.props.birthday !== 'string') return null;
    // Whole years from Ymd parts (not Instant math).
    const [by, bm, bd] = this.props.birthday.split('-').map(Number);
    const nowYmd = time.codec.toYmd(time.now());
    const [ty, tm, td] = nowYmd.split('-').map(Number);
    let age = ty - by;
    if (tm < bm || (tm === bm && td < bd)) age--;
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
  /** ADR-037: birthday is Ymd, not DomainDate. */
  get birthday(): Ymd | null {
    if (this.props.birthday == null) return null;
    if (typeof this.props.birthday === 'string') {
      return time.codec.parseYmd(this.props.birthday);
    }
    return normalizeBirthday(this.props.birthday);
  }

  public toDTO(): AccountProfileDTO {
    return { ...this.props, birthday: this.birthday };
  }
}
