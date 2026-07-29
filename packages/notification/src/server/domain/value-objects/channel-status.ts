import { ChannelStatus as ChannelStatusContract, type ChannelStatus as IChannelStatus } from '@memoflow/contracts/notification';

/**
 * 📝 渠道状态 - 通知在具体投递渠道中的状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ChannelStatus = IChannelStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: IChannelStatus[] = Object.values(ChannelStatusContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const ChannelStatus = {
  // ================= 常量定义 =================
  
  Pending: 'Pending' as ChannelStatus,
  Sent: 'Sent' as ChannelStatus,
  Delivered: 'Delivered' as ChannelStatus,
  Failed: 'Failed' as ChannelStatus,
  Cancelled: 'Cancelled' as ChannelStatus,

  // ================= 工厂方法 =================

  of(value: string): ChannelStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ChannelStatus: ${value}`);
    }
    return value as ChannelStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is ChannelStatus {
    return VALUES.includes(value as IChannelStatus);
  },

  // ================= 遍历方法 =================

  getAll(): ChannelStatus[] {
    return VALUES as ChannelStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断投递是否成功
   */
  isSuccessful(value: ChannelStatus): boolean {
    return value === 'Sent' || value === 'Delivered';
  },

  /**
   * 判断投递是否失败
   */
  isFailed(value: ChannelStatus): boolean {
    return value === 'Failed';
  },

  /**
   * 判断是否仍在处理中
   */
  isProcessing(value: ChannelStatus): boolean {
    return value === 'Pending' || value === 'Sent';
  },
};
