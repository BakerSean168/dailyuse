/**
 * Notification Service
 *
 * Manages native desktop notifications using Electron's Notification API.
 * Handles system tray notifications, sounds, and interaction events.
 * Includes support for "Do Not Disturb" (DND) mode and scheduling.
 *
 * @module services/notification
 */

import { Notification, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { eventBus } from '@dailyuse/utils';
import type { NotificationDispatchDesktopEvent } from '@dailyuse/contracts/notification';
import { getCustomNotificationManager } from './custom-notification.manager';

/**
 * Configuration options for displaying a notification.
 */
export interface NotificationOptions {
  /** The title of the notification. */
  title: string;
  /** The body text of the notification. */
  body: string;
  /** Path to a custom icon. */
  icon?: string;
  /** Whether to play a sound. */
  sound?: boolean;
  /** The urgency level of the notification. */
  urgency?: 'normal' | 'critical' | 'low';
  /** Whether the notification should be silent. Overrides `sound` if true. */
  silent?: boolean;
  /** Arbitrary data payload to attach to the notification (useful for click handling). */
  data?: Record<string, unknown>;
}

/**
 * Service class for managing application notifications.
 * Implements the Singleton pattern.
 */
export class NotificationService {
  private static instance: NotificationService;
  private mainWindow: BrowserWindow | null = null;
  private defaultIcon: Electron.NativeImage | null = null;

  // Do Not Disturb (DND) state
  private dndEnabled: boolean = false;
  private dndStartHour: number = 22; // Default: Starts at 22:00
  private dndEndHour: number = 7; // Default: Ends at 07:00
  private dndScheduleEnabled: boolean = false;

  // Custom Notification Setting
  private useCustomNotification: boolean = true; // Default to custom for now

  private constructor() {
    this.initDefaultIcon();
    this.initEventListeners();
  }

  /**
   * Retrieves the singleton instance of the NotificationService.
   *
   * @returns {NotificationService} The singleton instance.
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Sets the main window reference.
   * Required for sending IPC messages back to the renderer process upon notification interaction.
   *
   * @param {BrowserWindow} window - The main application window.
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Sets whether to use custom notifications or native ones.
   */
  setUseCustomNotification(useCustom: boolean): void {
    this.useCustomNotification = useCustom;
  }

  // ===== Do Not Disturb Methods =====

  /**
   * Manually enables Do Not Disturb mode.
   * Suppresses all non-critical notifications.
   */
  enableDND(): void {
    this.dndEnabled = true;
    console.log('[NotificationService] DND mode enabled');
  }

  /**
   * Manually disables Do Not Disturb mode.
   */
  disableDND(): void {
    this.dndEnabled = false;
    console.log('[NotificationService] DND mode disabled');
  }

  /**
   * Toggles the state of Do Not Disturb mode.
   *
   * @returns {boolean} The new state of DND mode (true = enabled).
   */
  toggleDND(): boolean {
    this.dndEnabled = !this.dndEnabled;
    console.log(`[NotificationService] DND mode ${this.dndEnabled ? 'enabled' : 'disabled'}`);
    return this.dndEnabled;
  }

  /**
   * Checks if Do Not Disturb mode is manually enabled.
   *
   * @returns {boolean} True if DND is manually enabled.
   */
  isDNDEnabled(): boolean {
    return this.dndEnabled;
  }

  /**
   * Configures the automatic schedule for Do Not Disturb mode.
   *
   * @param {number} startHour - The hour (0-23) to start DND.
   * @param {number} endHour - The hour (0-23) to end DND.
   */
  setDNDSchedule(startHour: number, endHour: number): void {
    this.dndStartHour = startHour;
    this.dndEndHour = endHour;
    this.dndScheduleEnabled = true;
    console.log(`[NotificationService] DND schedule set: ${startHour}:00 - ${endHour}:00`);
  }

  /**
   * Disables the automatic DND schedule.
   */
  disableDNDSchedule(): void {
    this.dndScheduleEnabled = false;
    console.log('[NotificationService] DND schedule disabled');
  }

  /**
   * Retrieves the current DND configuration.
   *
   * @returns {Object} The current DND settings.
   */
  getDNDConfig(): {
    enabled: boolean;
    scheduleEnabled: boolean;
    startHour: number;
    endHour: number;
  } {
    return {
      enabled: this.dndEnabled,
      scheduleEnabled: this.dndScheduleEnabled,
      startHour: this.dndStartHour,
      endHour: this.dndEndHour,
    };
  }

  /**
   * Checks if the application is currently in a DND period (either manual or scheduled).
   *
   * @returns {boolean} True if notifications should be suppressed.
   */
  private isInDNDPeriod(): boolean {
    if (this.dndEnabled) {
      return true;
    }

    if (!this.dndScheduleEnabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    // Handle overnight schedules (e.g., 22:00 - 07:00)
    if (this.dndStartHour > this.dndEndHour) {
      return currentHour >= this.dndStartHour || currentHour < this.dndEndHour;
    }

    // Handle same-day schedules (e.g., 14:00 - 16:00)
    return currentHour >= this.dndStartHour && currentHour < this.dndEndHour;
  }

  /**
   * Initializes the default application icon for notifications.
   */
  private initDefaultIcon(): void {
    try {
      // Attempt to load the app icon
      const iconPath = path.join(__dirname, '../assets/icon.png');
      this.defaultIcon = nativeImage.createFromPath(iconPath);
    } catch (err) {
      console.warn('[NotificationService] Failed to load default icon:', err);
    }
  }

  /**
   * Initializes internal event listeners for system events (reminders, schedules).
   */
  private initEventListeners(): void {
    eventBus.on(
      'notification:dispatch_desktop' as any,
      (event: NotificationDispatchDesktopEvent) => {
        this.showNotification({
          title: event.title,
          body: event.body ?? '',
          icon: event.icon ?? undefined,
          silent: event.silent,
          sound: event.sound?.enabled ?? true,
          data: event.data,
        });
      },
    );

    // Listen for setting changes to dynamically update notification style preference
    eventBus.on(
      'setting:UserSettingPatched',
      (eventData: { category: string; changes: Record<string, unknown> }) => {
        if (eventData.category === 'notification' && 'useCustomNotification' in eventData.changes) {
          this.useCustomNotification = Boolean(eventData.changes.useCustomNotification);
          console.log(
            `[NotificationService] Updated useCustomNotification preference to: ${this.useCustomNotification}`,
          );
        }
      },
    );

    // Also listen to full import/reset events where we might receive the full tree
    eventBus.on('setting:SettingImported' as any, (eventData: any) => {
      if (eventData?.preferences?.notification?.useCustomNotification !== undefined) {
        this.useCustomNotification = Boolean(
          eventData.preferences.notification.useCustomNotification,
        );
      }
    });

    // Also listen to successful login to fetch initial preferences
    eventBus.on('auth:login_success' as any, (eventData: any) => {
      if (eventData?.user?.settings?.notification?.useCustomNotification !== undefined) {
        this.useCustomNotification = Boolean(
          eventData.user.settings.notification.useCustomNotification,
        );
      }
    });
  }

  /**
   * Displays a system notification.
   *
   * @param {NotificationOptions} options - The notification options.
   * @returns {Notification | null} The Notification instance, or null if suppressed/unsupported.
   */
  showNotification(options: NotificationOptions): Notification | null {
    // Check DND status
    if (this.isInDNDPeriod()) {
      console.log('[NotificationService] Notification suppressed (DND mode):', options.title);
      // Log notification but do not show, optionally inform renderer of suppression
      if (this.mainWindow) {
        this.mainWindow.webContents.send('notification:suppressed', {
          title: options.title,
          body: options.body,
          data: options.data,
        });
      }
      return null;
    }

    // We try to grab the latest setting from IPC if a user identity is known,
    // though this might be better cached. Doing it synchronously here is impossible,
    // so we rely on explicit sync calls or the cached value.
    if (this.useCustomNotification) {
      // Use Custom Notification Manager
      const customManager = getCustomNotificationManager();
      customManager.dispatch(options);
      return null; // Custom notifications don't return an Electron.Notification instance
    } else {
      // Check system support for native notifications
      if (!Notification.isSupported()) {
        console.warn('[NotificationService] Notifications are not supported on this system');
        return null;
      }

      const notification = new Notification({
        title: options.title,
        body: options.body,
        icon: options.icon
          ? nativeImage.createFromPath(options.icon)
          : (this.defaultIcon ?? undefined),
        silent: options.silent ?? !options.sound,
        urgency: options.urgency ?? 'normal',
      });

      // Handle click: focus window and navigate
      notification.on('click', () => {
        this.handleNotificationClick(options.data);
      });

      // Handle close
      notification.on('close', () => {
        console.log('[NotificationService] Notification closed:', options.title);
      });

      notification.show();
      return notification;
    }
  }

  /**
   * Handles user click on a notification.
   * Restores focus to the main window and sends a navigation event to the renderer.
   *
   * @param {Record<string, unknown>} [data] - The data payload associated with the notification.
   */
  private handleNotificationClick(data?: Record<string, unknown>): void {
    // Focus main window
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();

      // Send IPC message to renderer
      if (data) {
        this.mainWindow.webContents.send('notification:clicked', data);
      }
    }
  }

  /**
   * Handles custom actions on notifications (if implemented).
   *
   * @param {string} actionType - The type of action performed.
   * @param {Record<string, unknown>} [data] - Associated data.
   */
  private handleNotificationAction(actionType: string, data?: Record<string, unknown>): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('notification:action', {
        actionType,
        data,
      });
    }
  }

  /**
   * Helper to show a reminder notification.
   *
   * @param {Object} reminder - Reminder details.
   * @returns {Notification | null} The notification instance.
   */
  showReminderNotification(reminder: {
    id: string;
    title: string;
    body?: string;
    importance?: string;
  }): Notification | null {
    const urgency =
      reminder.importance === 'vital' || reminder.importance === 'important'
        ? ('critical' as const)
        : ('normal' as const);

    return this.showNotification({
      title: `🔔 ${reminder.title}`,
      body: reminder.body || '',
      urgency,
      sound: true,
      data: {
        type: 'reminder',
        id: reminder.id,
      },
    });
  }

  /**
   * Helper to show a schedule notification.
   *
   * @param {Object} task - Schedule task details.
   * @returns {Notification | null} The notification instance.
   */
  showScheduleNotification(task: {
    id: string;
    name: string;
    description?: string;
  }): Notification | null {
    return this.showNotification({
      title: `📅 ${task.name}`,
      body: task.description || '调度任务已触发',
      sound: true,
      data: {
        type: 'schedule',
        id: task.id,
      },
    });
  }

  /**
   * Helper to show a goal progress notification.
   *
   * @param {Object} goal - Goal progress details.
   * @returns {Notification | null} The notification instance.
   */
  showGoalProgressNotification(goal: {
    id: string;
    title: string;
    progress: number;
    targetValue: number;
  }): Notification | null {
    const percentage = Math.round((goal.progress / goal.targetValue) * 100);
    return this.showNotification({
      title: `🎯 目标进度更新`,
      body: `${goal.title}: ${percentage}% (${goal.progress}/${goal.targetValue})`,
      data: {
        type: 'goal',
        id: goal.id,
      },
    });
  }

  /**
   * Helper to show a task completion notification.
   *
   * @param {Object} task - Completed task details.
   * @returns {Notification | null} The notification instance.
   */
  showTaskCompletedNotification(task: { id: string; title: string }): Notification | null {
    return this.showNotification({
      title: `✅ 任务已完成`,
      body: task.title,
      data: {
        type: 'task',
        id: task.id,
      },
    });
  }
}

/**
 * Initializes the notification service with the main window.
 *
 * @param {BrowserWindow} mainWindow - The main application window.
 * @returns {NotificationService} The initialized service instance.
 */
export function initNotificationService(mainWindow: BrowserWindow): NotificationService {
  const service = NotificationService.getInstance();
  service.setMainWindow(mainWindow);
  return service;
}
