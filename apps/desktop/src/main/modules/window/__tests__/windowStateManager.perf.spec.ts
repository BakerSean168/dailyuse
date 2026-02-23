import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WindowStateManager } from '../windowStateManager';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Setup temp directory
const tempDir = path.join(os.tmpdir(), 'desktop-window-perf-' + Date.now());
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Mock electron
vi.mock('electron', () => {
  return {
    app: {
      getPath: () => tempDir,
    },
    screen: {
      getAllDisplays: () => [
        { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      ],
    },
    BrowserWindow: class {
      listeners: Record<string, any> = {};
      on(event: string, handler: any) {
        this.listeners[event] = handler;
      }
      removeListener(event: string) {
        delete this.listeners[event];
      }
      getBounds() {
        return { x: 100, y: 100, width: 800, height: 600 };
      }
      isMaximized() {
        return false;
      }
      maximize() {}
    },
  };
});

describe('WindowStateManager Performance', () => {
  let manager: WindowStateManager;
  const iterations = 100; // 100 iterations is enough to see blocking

  beforeEach(() => {
    // Clean up files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    }
  });

  it('should measure saveState performance', async () => {
    manager = new WindowStateManager('test-window', {
      defaultWidth: 800,
      defaultHeight: 600,
    });

    // Import dynamically or assume it's mocked via vi.mock which handles imports
    const { BrowserWindow } = await import('electron');
    const win = new BrowserWindow();
    manager.manage(win);

    const start = performance.now();
    const promises = [];

    for (let i = 0; i < iterations; i++) {
      // Call saveState directly to bypass debounce in stateChangeHandler
      // casting to any to access private method
      const result = (manager as any).saveState();

      if (result instanceof Promise) {
        promises.push(result);
      }
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`[Benchmark] ${iterations} saveState calls took ${duration.toFixed(2)}ms`);
    console.log(`[Benchmark] Average time per call: ${(duration / iterations).toFixed(2)}ms`);

    if (promises.length > 0) {
        await Promise.all(promises);
    } else {
        // Sync version, verify file exists immediately
        const configPath = path.join(tempDir, 'window-state-test-window.json');
        expect(fs.existsSync(configPath)).toBe(true);
    }
  });
});
