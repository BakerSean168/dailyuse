/**
 * 通知权限检测服务
 * 检测浏览器和系统级别的通知权限状态
 */
export class NotificationPermissionService {
  private static instance: NotificationPermissionService;

  private constructor() {}

  static getInstance(): NotificationPermissionService {
    if (!NotificationPermissionService.instance) {
      NotificationPermissionService.instance = new NotificationPermissionService();
    }
    return NotificationPermissionService.instance;
  }

  /**
   * 检查浏览器是否支持通知 API
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * 获取当前通知权限状态
   * @returns 'default' | 'granted' | 'denied'
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * 检查通知是否已被授权
   */
  isPermissionGranted(): boolean {
    return this.getPermissionStatus() === 'granted';
  }

  /**
   * 检查通知是否被拒绝
   */
  isPermissionDenied(): boolean {
    return this.getPermissionStatus() === 'denied';
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      console.warn('[NotificationPermissionService] 浏览器不支持通知 API');
      return 'denied';
    }

    if (this.getPermissionStatus() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[NotificationPermissionService] 通知权限请求结果:', permission);
      return permission;
    } catch (error) {
      console.error('[NotificationPermissionService] 请求通知权限失败:', error);
      return 'denied';
    }
  }

  /**
   * 测试系统通知是否真正可用
   * 有时浏览器权限是 granted，但系统级通知被禁用
   */
  async testSystemNotification(): Promise<boolean> {
    if (!this.isPermissionGranted()) {
      return false;
    }

    try {
      const testNotification = new Notification('测试通知', {
        body: '这是一条测试通知，用于检测系统通知是否可用',
        tag: 'test-notification',
        silent: true,
      });

      // 立即关闭测试通知
      setTimeout(() => {
        testNotification.close();
      }, 100);

      return true;
    } catch (error) {
      console.error('[NotificationPermissionService] 系统通知测试失败:', error);
      return false;
    }
  }

  /**
   * 获取通知权限的详细状态信息
   */
  async getDetailedStatus() {
    const supported = this.isNotificationSupported();
    const permission = this.getPermissionStatus();
    const systemAvailable =
      supported && permission === 'granted' ? await this.testSystemNotification() : false;

    return {
      supported,
      permission,
      granted: permission === 'granted',
      denied: permission === 'denied',
      systemAvailable,
      needsFallback: !systemAvailable, // 是否需要使用应用内备用通知
    };
  }

  /**
   * 获取用户友好的状态描述
   */
  async getStatusDescription(): Promise<string> {
    const status = await this.getDetailedStatus();

    if (!status.supported) {
      return '您的浏览器不支持桌面通知功能';
    }

    if (status.denied) {
      return '通知权限已被拒绝，请在浏览器设置中允许通知';
    }

    if (status.permission === 'default') {
      return '通知权限尚未设置，请允许通知以接收提醒';
    }

    if (!status.systemAvailable) {
      return '通知权限已授予，但系统级通知可能被禁用，将使用应用内通知';
    }

    return '通知功能正常';
  }
}
