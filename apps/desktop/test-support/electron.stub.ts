import { EventEmitter } from 'node:events';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { vi } from 'vitest';

const electronTestRoot = path.join(tmpdir(), 'dailyuse-electron-test');
mkdirSync(electronTestRoot, { recursive: true });

function createEmitterApi<T extends Record<string, unknown>>(shape: T) {
  const emitter = new EventEmitter();

  return Object.assign(shape, {
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
  });
}

function createNativeImageStub() {
  return {
    isEmpty: () => false,
    resize: () => createNativeImageStub(),
    toPNG: () => Buffer.alloc(0),
    getSize: () => ({ width: 16, height: 16 }),
  };
}

let nextWindowId = 1;
let nextWebContentsId = 1;
const browserWindows: BrowserWindow[] = [];

class MockWebContents extends EventEmitter {
  readonly id = nextWebContentsId++;
  readonly send = vi.fn();
  readonly openDevTools = vi.fn();
  readonly closeDevTools = vi.fn();
  readonly executeJavaScript = vi.fn();
  readonly insertCSS = vi.fn();
}

export class BrowserWindow extends EventEmitter {
  static getAllWindows = vi.fn(() => browserWindows.filter((window) => !window.isDestroyed()));
  static getFocusedWindow = vi.fn(
    () => browserWindows.find((window) => window.focused && !window.isDestroyed()) ?? null,
  );
  static fromWebContents = vi.fn(
    (webContents: MockWebContents) =>
      browserWindows.find(
        (window) => window.webContents === webContents && !window.isDestroyed(),
      ) ?? null,
  );
  static fromId = vi.fn(
    (id: number) => browserWindows.find((window) => window.id === id && !window.isDestroyed()) ?? null,
  );

  readonly id = nextWindowId++;
  readonly webContents = new MockWebContents();
  readonly options: Record<string, unknown>;

  private destroyed = false;
  private visible = false;
  private minimized = false;
  private maximized = false;
  private fullScreen = false;
  private readonly bounds: { x: number; y: number; width: number; height: number };
  private focused = false;

  constructor(options: Record<string, unknown> = {}) {
    super();
    this.options = options;
    this.bounds = {
      x: Number(options.x ?? 0),
      y: Number(options.y ?? 0),
      width: Number(options.width ?? 1024),
      height: Number(options.height ?? 768),
    };
    browserWindows.push(this);
  }

  readonly loadURL = vi.fn(async (_url: string) => undefined);
  readonly loadFile = vi.fn(async (_path: string, _options?: Record<string, unknown>) => undefined);
  readonly setMenuBarVisibility = vi.fn();
  readonly removeMenu = vi.fn();
  readonly setTitleBarOverlay = vi.fn();
  readonly setAutoHideMenuBar = vi.fn();
  readonly setSkipTaskbar = vi.fn();
  readonly setVisibleOnAllWorkspaces = vi.fn();
  readonly setAlwaysOnTop = vi.fn();
  readonly setContentProtection = vi.fn();
  readonly setBackgroundColor = vi.fn();
  readonly setIcon = vi.fn();
  readonly setMinimumSize = vi.fn();
  readonly center = vi.fn();
  readonly reload = vi.fn();

  isDestroyed(): boolean {
    return this.destroyed;
  }

  isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    this.visible = true;
    this.focused = true;
  }

  hide(): void {
    this.visible = false;
    this.focused = false;
  }

  focus(): void {
    this.focused = true;
  }

  close(): void {
    if (this.destroyed) {
      return;
    }
    this.visible = false;
    this.destroyed = true;
    this.focused = false;
    this.emit('closed');
  }

  destroy(): void {
    this.close();
  }

  minimize(): void {
    this.minimized = true;
    this.focused = false;
  }

  restore(): void {
    this.minimized = false;
    this.focused = true;
  }

  maximize(): void {
    this.maximized = true;
  }

  unmaximize(): void {
    this.maximized = false;
  }

  isMinimized(): boolean {
    return this.minimized;
  }

  isMaximized(): boolean {
    return this.maximized;
  }

  isFullScreen(): boolean {
    return this.fullScreen;
  }

  setFullScreen(value: boolean): void {
    this.fullScreen = value;
  }

  isFullScreenable(): boolean {
    return true;
  }

  isMinimizable(): boolean {
    return true;
  }

  isMaximizable(): boolean {
    return true;
  }

  isClosable(): boolean {
    return true;
  }

  getBounds() {
    return { ...this.bounds };
  }

  setBounds(nextBounds: Partial<typeof this.bounds>): void {
    Object.assign(this.bounds, nextBounds);
  }

  getSize(): [number, number] {
    return [this.bounds.width, this.bounds.height];
  }

  setSize(width: number, height: number): void {
    this.bounds.width = width;
    this.bounds.height = height;
  }
}

export const app = createEmitterApi({
  isPackaged: false,
  commandLine: {
    appendSwitch: vi.fn(),
  },
  getPath: vi.fn((name: string) => path.join(electronTestRoot, name)),
  setPath: vi.fn(),
  getVersion: vi.fn(() => '1.0.0-test'),
  getName: vi.fn(() => 'Memoflow-Test'),
  getAppPath: vi.fn(() => electronTestRoot),
  quit: vi.fn(),
  exit: vi.fn(),
  relaunch: vi.fn(),
  whenReady: vi.fn(async () => undefined),
  requestSingleInstanceLock: vi.fn(() => true),
  releaseSingleInstanceLock: vi.fn(),
  setAppUserModelId: vi.fn(),
});

export const ipcMain = createEmitterApi({
  handle: vi.fn(),
  removeHandler: vi.fn(),
});

export const safeStorage = {
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((value: string) => Buffer.from(value, 'utf8')),
  decryptString: vi.fn((value: Buffer) => value.toString('utf8')),
};

export const net = {
  isOnline: vi.fn(() => true),
};

export const powerMonitor = createEmitterApi({});

export const nativeTheme = {
  shouldUseDarkColors: false,
  themeSource: 'light',
};

export const nativeImage = {
  createFromPath: vi.fn(() => createNativeImageStub()),
  createFromDataURL: vi.fn(() => createNativeImageStub()),
  createEmpty: vi.fn(() => createNativeImageStub()),
};

export class Notification {
  static isSupported = vi.fn(() => true);

  readonly show = vi.fn();

  constructor(_options?: Record<string, unknown>) {}
}

export const dialog = {
  showOpenDialog: vi.fn(async () => ({ canceled: false, filePaths: [] })),
  showSaveDialog: vi.fn(async () => ({ canceled: false, filePath: undefined })),
  showMessageBox: vi.fn(async () => ({ response: 0 })),
};

export const shell = {
  openExternal: vi.fn(async () => undefined),
  openPath: vi.fn(async () => ''),
};

export const screen = {
  getPrimaryDisplay: vi.fn(() => ({
    workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    workAreaSize: { width: 1920, height: 1080 },
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1,
  })),
  getAllDisplays: vi.fn(() => [
    {
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      workAreaSize: { width: 1920, height: 1080 },
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1,
    },
  ]),
};

export const Menu = {
  buildFromTemplate: vi.fn(() => ({ popup: vi.fn() })),
  setApplicationMenu: vi.fn(),
};

export class Tray extends EventEmitter {
  readonly setToolTip = vi.fn();
  readonly setContextMenu = vi.fn();
  readonly destroy = vi.fn();

  constructor(_image?: unknown) {
    super();
  }
}

export const globalShortcut = {
  register: vi.fn(() => true),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
  isRegistered: vi.fn(() => false),
};
