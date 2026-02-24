/**
 * Notification Application Services (Facade)
 *
 * TODO: Implement facade services that compose individual use-case services.
 * These are placeholder stubs to satisfy the module constructor.
 */

export class NotificationApplicationService {
  async listNotifications(_params?: unknown): Promise<unknown[]> {
    return [];
  }

  async getNotification(_id: string): Promise<unknown | null> {
    return null;
  }

  async createNotification<T = unknown>(dto: T): Promise<T> {
    return dto;
  }

  async markAsRead(_id: string): Promise<void> {}

  async markAllAsRead(_identityId: string): Promise<void> {}

  async deleteNotification(_id: string): Promise<void> {}

  async clearAll(_identityId: string): Promise<void> {}

  async getUnreadCount(_identityId: string): Promise<number> {
    return 0;
  }
}

export class NotificationTemplateApplicationService {
  // TODO: Implement template facade service
}

export class NotificationChannelApplicationService {
  async getPreferences(_identityId: string): Promise<Record<string, unknown>> {
    return {};
  }

  async updatePreferences<T = unknown>(dto: T): Promise<T> {
    return dto;
  }
}
