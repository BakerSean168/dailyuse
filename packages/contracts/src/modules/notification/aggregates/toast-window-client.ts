export interface ToastWindowClient {
  id: string;
  notificationId: string;
  state: 'SHOWING' | 'HOVERED' | 'SNOOZED' | 'CLOSED';
  viewOrder: number;
  durationMs: number;
  actions: string[]; // Array of NotificationAction IDs
}