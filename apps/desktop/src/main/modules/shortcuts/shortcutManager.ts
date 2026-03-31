/**
 * @file Shortcut Manager
 * @description
 * Manages global and local keyboard shortcuts for the application.
 *
 * @module modules/shortcuts/shortcutManager
 */

import { globalShortcut, BrowserWindow } from 'electron';

/**
 * @interface ShortcutConfig
 * @description Interface defining a keyboard shortcut configuration.
 */
export interface ShortcutConfig {
  /** The unique identifier for the shortcut (e.g., 'show-app'). */
  id: string;
  /** The accelerator string (e.g., 'CommandOrControl+Shift+D'). */
  accelerator: string;
  /** Description of what the shortcut does. */
  description: string;
  /** Whether the shortcut is global (works when app is not focused). */
  global: boolean;
  /** Whether the shortcut is currently enabled. */
  enabled: boolean;
  /** The action to execute when triggered. */
  action: () => void;
}

/**
 * @class ShortcutManager
 * @description Manages application keyboard shortcuts.
 */
export class ShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();

  /**
   * @constructor
   * @description Creates an instance of ShortcutManager.
   *
   * @param {BrowserWindow} mainWindow - The main application window.
   */
  constructor(private mainWindow: BrowserWindow) {
    this.registerDefaultShortcuts();
  }

  setMainWindow(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  /**
   * @method registerDefaultShortcuts
   * @description Registers default application shortcuts.
   */
  private registerDefaultShortcuts(): void {
    this.register({
      id: 'show-app',
      accelerator: 'CommandOrControl+Shift+D',
      description: 'Show/Hide Application',
      global: true,
      enabled: true,
      action: () => {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      },
    });

    // Add more default shortcuts here
  }

  /**
   * @method register
   * @description Registers a new shortcut.
   *
   * @param {ShortcutConfig} config - The shortcut configuration.
   * @returns {boolean} True if registration was successful.
   */
  register(config: ShortcutConfig): boolean {
    if (this.shortcuts.has(config.accelerator)) {
      console.warn(`Shortcut ${config.accelerator} is already registered.`);
      return false;
    }

    this.shortcuts.set(config.accelerator, config);

    if (config.enabled) {
      if (config.global) {
        try {
          const success = globalShortcut.register(config.accelerator, config.action);
          if (!success) {
            console.warn(`Failed to register global shortcut: ${config.accelerator}`);
            return false;
          }
        } catch (error) {
          console.error(`Error registering global shortcut ${config.accelerator}:`, error);
          return false;
        }
      } else {
        // Local shortcuts are typically handled via menu or renderer events
        // For simplicity, we'll focus on global shortcuts here or specific menu integration
      }
    }

    return true;
  }

  /**
   * @method unregister
   * @description Unregisters a shortcut.
   *
   * @param {string} accelerator - The accelerator string to unregister.
   */
  unregister(accelerator: string): void {
    const config = this.shortcuts.get(accelerator);
    if (!config) return;

    if (config.global) {
      globalShortcut.unregister(accelerator);
    }

    this.shortcuts.delete(accelerator);
  }

  /**
   * @method unregisterAll
   * @description Unregisters all shortcuts.
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.shortcuts.clear();
  }

  /**
   * @method getShortcuts
   * @description Returns a list of all managed shortcuts.
   *
   * @returns {ShortcutConfig[]} Array of shortcut configurations.
   */
  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }
}
