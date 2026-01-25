/**
 * User Reminder Preferences Aggregate Root - Server
 * 用户提醒偏好聚合根 - 服务端
 */

// ============ 值对象：TimeSlot ============

/**
 * Time Slot DTO
 * 时间段（用于记录最佳/最差响应时间段）
 */
export interface TimeSlotDTO {
  readonly hourStart: number; // 开始小时 (0-23)
  readonly hourEnd: number; // 结束小时 (0-23)
  readonly avgResponseRate: number; // 平均响应率 (0-100)
  readonly sampleCount: number; // 样本数量
}

// ============ DTO 定义 ============

/**
 * User Reminder Preferences Server DTO
 */
export interface UserReminderPreferencesServerDTO {
  uuid: string;
  accountUuid: string;
  bestTimeSlots: TimeSlotDTO[]; // 最佳时间段
  worstTimeSlots: TimeSlotDTO[]; // 最差时间段
  globalSmartFrequency: boolean; // 全局启用智能频率
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * User Reminder Preferences Client DTO
 */
export interface UserReminderPreferencesClientDTO {
  uuid: string;
  accountUuid: string;
  bestTimeSlots: TimeSlotDTO[];
  worstTimeSlots: TimeSlotDTO[];
  globalSmartFrequency: boolean;
  createdAt: number;
  updatedAt: number;
  // UI 显示文本
  bestTimeSlotsText: string; // "09:00-10:00, 18:00-19:00"
  worstTimeSlotsText: string; // "12:00-13:00, 22:00-23:00"
}

/**
 * User Reminder Preferences Persistence DTO
 */
export interface UserReminderPreferencesPersistenceDTO {
  uuid: string;
  accountUuid: string;
  bestTimeSlots: string; // JSON string
  worstTimeSlots: string; // JSON string
  globalSmartFrequency: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

/**
 * User Reminder Preferences 聚合根接口
 */
export interface UserReminderPreferencesServer {
  uuid: string;
  accountUuid: string;
  bestTimeSlots: TimeSlotDTO[];
  worstTimeSlots: TimeSlotDTO[];
  globalSmartFrequency: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 业务方法
  addBestTimeSlot(timeSlot: TimeSlotDTO): void;
  addWorstTimeSlot(timeSlot: TimeSlotDTO): void;
  updateTimeSlots(best: TimeSlotDTO[], worst: TimeSlotDTO[]): void;
  toggleGlobalSmartFrequency(enabled: boolean): void;
  getBestTimeSlot(): TimeSlotDTO | null; // 获取响应率最高的时间段
  getWorstTimeSlot(): TimeSlotDTO | null; // 获取响应率最低的时间段
  isGoodTimeToRemind(hour: number): boolean; // 判断某个小时是否是好时机

  // 转换方法
  toServerDTO(): UserReminderPreferencesServerDTO;
  toClientDTO(): UserReminderPreferencesClientDTO;
  toPersistenceDTO(): UserReminderPreferencesPersistenceDTO;
}

/**
 * User Reminder Preferences 静态工厂方法接口
 */
export interface UserReminderPreferencesServerStatic {
  /**
   * 创建新的 User Reminder Preferences（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    bestTimeSlots?: TimeSlotDTO[];
    worstTimeSlots?: TimeSlotDTO[];
    globalSmartFrequency?: boolean;
  }): UserReminderPreferencesServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: UserReminderPreferencesServerDTO): UserReminderPreferencesServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: UserReminderPreferencesPersistenceDTO): UserReminderPreferencesServer;
}
