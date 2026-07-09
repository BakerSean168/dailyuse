import { SettingScope as SettingScopeContract, type SettingScope as ISettingScope } from '@dailyuse/contracts/setting';

/**
 * 📝 设置作用域 - 设置的应用范围
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SettingScope = ISettingScope & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ISettingScope[] = Object.values(SettingScopeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SettingScope = {
  // ================= 常量定义 =================
  
  System: 'System' as SettingScope,
  User: 'User' as SettingScope,
  Device: 'Device' as SettingScope,

  // ================= 工厂方法 =================

  of(value: string): SettingScope {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SettingScope: ${value}`);
    }
    return value as SettingScope;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SettingScope {
    return VALUES.includes(value as ISettingScope);
  },

  // ================= 遍历方法 =================

  getAll(): SettingScope[] {
    return VALUES as SettingScope[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为系统级设置
   */
  isSystem(value: SettingScope): boolean {
    return value === 'System';
  },

  /**
   * 判断是否为用户级设置
   */
  isUser(value: SettingScope): boolean {
    return value === 'User';
  },

  /**
   * 判断是否为设备级设置
   */
  isDevice(value: SettingScope): boolean {
    return value === 'Device';
  },

  /**
   * 判断是否为用户个性化设置（用户级或设备级）
   */
  isPersonal(value: SettingScope): boolean {
    return value === 'User' || value === 'Device';
  },
};
