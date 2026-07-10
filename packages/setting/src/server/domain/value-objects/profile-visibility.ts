import { ProfileVisibility as ProfileVisibilityContract, type ProfileVisibility as IProfileVisibility } from '@dailyuse/contracts/setting';

/**
 * 📝 隐私可见性 - 个人资料的可见性
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ProfileVisibility = IProfileVisibility & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IProfileVisibility[] = Object.values(ProfileVisibilityContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ProfileVisibility = {
  // ================= 常量定义 =================
  
  Public: 'Public' as ProfileVisibility,
  Private: 'Private' as ProfileVisibility,
  FriendsOnly: 'FriendsOnly' as ProfileVisibility,

  // ================= 工厂方法 =================

  of(value: string): ProfileVisibility {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ProfileVisibility: ${value}`);
    }
    return value as ProfileVisibility;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ProfileVisibility {
    return VALUES.includes(value as IProfileVisibility);
  },

  // ================= 遍历方法 =================

  getAll(): ProfileVisibility[] {
    return VALUES as ProfileVisibility[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为公开
   */
  isPublic(value: ProfileVisibility): boolean {
    return value === 'Public';
  },

  /**
   * 判断是否为私密
   */
  isPrivate(value: ProfileVisibility): boolean {
    return value === 'Private';
  },

  /**
   * 判断是否为仅朋友可见
   */
  isFriendsOnly(value: ProfileVisibility): boolean {
    return value === 'FriendsOnly';
  },

  /**
   * 判断是否为受限（私密或仅朋友可见）
   */
  isRestricted(value: ProfileVisibility): boolean {
    return value === 'Private' || value === 'FriendsOnly';
  },
};
