/**
 * @file Electron Preload Script
 * @description
 * Implements a secure `contextBridge` to expose specific API capabilities to the renderer process.
 * Acts as a security barrier, ensuring only authorized IPC channels can be accessed.
 * Follows Electron security best practices (context isolation, sandboxing).
 *
 * The exposed API matches the `ElectronAPI` type definition expected by `@dailyuse/infrastructure-client`.
 *
 * @module preload
 */

import { contextBridge, ipcRenderer } from 'electron';
import { ALLOWED_CHANNELS } from './allowed-channels';

// ========== IPC Channel Whitelist ==========
// Security: Only allow communication on these specific channels.

/**
 * @typedef AllowedChannel
 * @description Type representing valid allowed channels.
 */
type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

// Fast lookup set for allowed channels
const allowedChannelsSet = new Set<string>(ALLOWED_CHANNELS);

/**
 * @function isAllowedChannel
 * @description Validates if a channel string is permitted.
 *
 * @param {string} channel - The channel name to check.
 * @returns {boolean} True if the channel is allowed.
 */
function isAllowedChannel(channel: string): channel is AllowedChannel {
  return allowedChannelsSet.has(channel);
}

// Map to store event listeners for safe removal
const eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();

/**
 * @constant electronAPI
 * @description The API exposed to the renderer process via `window.electronAPI`.
 *
 * Implements the `ElectronAPI` interface used by the frontend infrastructure client.
 */
const electronAPI = {
  /**
   * @method invoke
   * @description Invokes a main process handler via IPC.
   * Used for request-response communication (e.g., fetching data).
   *
   * @template T The expected return type.
   * @param {string} channel - The IPC channel name.
   * @param {...unknown[]} args - Arguments to pass to the handler.
   * @returns {Promise<T>} A promise that resolves with the handler's result.
   */
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    if (!isAllowedChannel(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * @method on
   * @description Registers a listener for messages sent from the main process.
   * Used for push notifications or event updates.
   *
   * @param {string} channel - The IPC channel to listen on.
   * @param {(...args: unknown[]) => void} callback - The function to call when a message is received.
   */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isAllowedChannel(channel)) {
      console.warn(`IPC channel "${channel}" is not allowed for listening`);
      return;
    }

    // Wrap callback to strip the event object from arguments, exposing only data
    const wrappedCallback = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };

    // Store for cleanup
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, new Set());
    }
    eventListeners.get(channel)!.add(callback);

    // Attach wrapped reference to original callback for removal
    (callback as unknown as { __wrapped: typeof wrappedCallback }).__wrapped = wrappedCallback;

    ipcRenderer.on(channel, wrappedCallback);
  },

  /**
   * @method off
   * @description Removes a previously registered listener.
   *
   * @param {string} channel - The IPC channel.
   * @param {(...args: unknown[]) => void} callback - The original callback function to remove.
   */
  off: (channel: string, callback: (...args: unknown[]) => void): void => {
    const wrappedCallback = (callback as unknown as { __wrapped: (...args: unknown[]) => void })
      .__wrapped;
    if (wrappedCallback) {
      ipcRenderer.removeListener(channel, wrappedCallback);
    }

    // Clean up internal map
    eventListeners.get(channel)?.delete(callback);
  },
};

// Expose the API to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export type for TypeScript usage in renderer
export type ElectronAPI = typeof electronAPI;
