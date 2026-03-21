/**
 * Window Manager - 窗口管理器
 *
 * 管理 Desktop 应用的多窗口系统：
 * - 登录窗口（小窗口）
 * - 主窗口（完整应用）
 *
 * 启动流程：
 * 1. 检查是否有有效 Session 且启用了自动登录
 * 2. 是 → 直接创建主窗口
 * 3. 否 → 显示登录窗口，登录成功后切换到主窗口
 */

import { BrowserWindow, screen, ipcMain, app, nativeTheme } from 'electron';
import type { BrowserWindowConstructorOptions, TitleBarOverlay } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '@dailyuse/utils';
import { hasResolvedPreload, resolvePreloadPath } from '../utils/resolve-preload-path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('WindowManager');

function getDesktopChromePalette() {
  return nativeTheme.shouldUseDarkColors
    ? {
        background: '#0f172a',
        foreground: '#e2e8f0',
      }
    : {
        background: '#f8fafc',
        foreground: '#0f172a',
      };
}

function createNativeWindowChromeOptions(): Pick<
  BrowserWindowConstructorOptions,
  'autoHideMenuBar' | 'backgroundColor' | 'title' | 'titleBarStyle' | 'titleBarOverlay'
> {
  const palette = getDesktopChromePalette();
  const options: Pick<
    BrowserWindowConstructorOptions,
    'autoHideMenuBar' | 'backgroundColor' | 'title' | 'titleBarStyle' | 'titleBarOverlay'
  > = {
    autoHideMenuBar: true,
    backgroundColor: palette.background,
    title: '',
    titleBarStyle: 'hidden',
  };

  if (process.platform === 'win32' || process.platform === 'linux') {
    options.titleBarOverlay = {
      color: palette.background,
      symbolColor: palette.foreground,
      height: 36,
    } satisfies TitleBarOverlay;
  }

  return options;
}

// ============ Types ============

export interface WindowManagerConfig {
  /** 预加载脚本路径 */
  preloadPath?: string;
  /** 开发服务器 URL */
  devServerUrl?: string;
  /** 是否为开发模式 */
  isDev?: boolean;
}

export type WindowType = 'login' | 'main';

export interface LoginWindowOptions {
  /** 是否有可快速登录的账号 */
  hasQuickLoginAccounts?: boolean;
  /** 快速登录账号列表 */
  quickLoginAccounts?: QuickLoginAccount[];
}

export interface QuickLoginAccount {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  lastLoginAt?: number;
}

// ============ Window Manager ============

/**
 * 窗口管理器
 *
 * 负责创建和管理登录窗口、主窗口，处理窗口间切换
 */
export class WindowManager {
  private static instance: WindowManager | null = null;

  private loginWindow: BrowserWindow | null = null;
  private mainWindow: BrowserWindow | null = null;

  private readonly config: Required<WindowManagerConfig>;
  private isTransitioning = false;

  private constructor(config: WindowManagerConfig = {}) {
    const preloadPath = config.preloadPath || resolvePreloadPath(__dirname);

    this.config = {
      preloadPath,
      devServerUrl:
        config.devServerUrl || process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173',
      isDev: config.isDev ?? process.env.NODE_ENV === 'development',
    };

    if (!hasResolvedPreload(__dirname)) {
      logger.error('Resolved preload script does not exist', {
        preloadPath: this.config.preloadPath,
        currentDir: __dirname,
      });
    } else {
      logger.info('Resolved preload script', { preloadPath: this.config.preloadPath });
    }

    this.registerIpcHandlers();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: WindowManagerConfig): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager(config);
    }
    return WindowManager.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    if (WindowManager.instance) {
      WindowManager.instance.cleanup();
      WindowManager.instance = null;
    }
  }

  // ============ Window Creation ============

  /**
   * 创建登录窗口
   */
  createLoginWindow(options: LoginWindowOptions = {}): BrowserWindow {
    void options;

    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.focus();
      return this.loginWindow;
    }

    logger.info('Creating login window');

    // 获取主显示器尺寸用于居中
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // 登录窗口尺寸
    const windowWidth = 420;
    const windowHeight = 580;

    this.loginWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: Math.round((screenWidth - windowWidth) / 2),
      y: Math.round((screenHeight - windowHeight) / 2),
      resizable: false,
      maximizable: false,
      minimizable: true,
      fullscreenable: false,
      ...createNativeWindowChromeOptions(),
      webPreferences: {
        preload: this.config.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
      show: false,
    });

    this.loginWindow.setMenuBarVisibility(false);
    this.loginWindow.removeMenu();

    this.attachWindowDiagnostics(this.loginWindow, 'login');

    // 准备好后显示
    this.loginWindow.once('ready-to-show', () => {
      this.loginWindow?.show();
      logger.info('Login window shown');
    });

    // app-vue exposes the authentication shell at /auth, not /login.
    this.loadWindowContent(this.loginWindow, '/auth');

    if (this.config.isDev) {
      this.loginWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // 窗口关闭事件
    this.loginWindow.on('closed', () => {
      this.loginWindow = null;
      // 如果没有主窗口且不是在切换过程中，退出应用
      if (!this.mainWindow && !this.isTransitioning) {
        app.quit();
      }
    });

    return this.loginWindow;
  }

  /**
   * 创建主窗口
   */
  createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    logger.info('Creating main window');

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      ...createNativeWindowChromeOptions(),
      webPreferences: {
        preload: this.config.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
      show: false,
    });

    this.mainWindow.setMenuBarVisibility(false);
    this.mainWindow.removeMenu();

    this.attachWindowDiagnostics(this.mainWindow, 'main');

    // 准备好后显示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      logger.info('Main window shown');
    });

    // 加载主页面
    this.loadWindowContent(this.mainWindow, '/');

    // 开发模式打开 DevTools
    if (this.config.isDev) {
      this.mainWindow.webContents.openDevTools();
    }

    // 窗口关闭事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  // ============ Window Transition ============

  /**
   * 登录成功后切换到主窗口
   */
  async transitionToMainWindow(): Promise<void> {
    if (this.isTransitioning) {
      logger.warn('Already transitioning');
      return;
    }

    this.isTransitioning = true;
    logger.info('Transitioning from login to main window');

    try {
      // 1. 创建主窗口（先不显示）
      const mainWin = this.createMainWindow();

      // 2. 等待主窗口准备好
      await new Promise<void>((resolve) => {
        if (mainWin.isVisible()) {
          resolve();
        } else {
          mainWin.once('ready-to-show', () => resolve());
        }
      });

      // 3. 显示主窗口
      mainWin.show();

      // 4. 关闭登录窗口（稍微延迟，让过渡更平滑）
      setTimeout(() => {
        if (this.loginWindow && !this.loginWindow.isDestroyed()) {
          this.loginWindow.close();
        }
      }, 100);

      logger.info('Transition complete');
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * 登出后切换到登录窗口
   */
  async transitionToLoginWindow(): Promise<void> {
    if (this.isTransitioning) {
      logger.warn('Already transitioning');
      return;
    }

    this.isTransitioning = true;
    logger.info('Transitioning from main to login window');

    try {
      // 1. 创建登录窗口
      const loginWin = this.createLoginWindow();

      // 2. 等待登录窗口准备好
      await new Promise<void>((resolve) => {
        if (loginWin.isVisible()) {
          resolve();
        } else {
          loginWin.once('ready-to-show', () => resolve());
        }
      });

      // 3. 显示登录窗口
      loginWin.show();

      // 4. 关闭主窗口
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.close();
        }
      }, 100);

      logger.info('Transition complete');
    } finally {
      this.isTransitioning = false;
    }
  }

  // ============ Window Access ============

  /**
   * 获取登录窗口
   */
  getLoginWindow(): BrowserWindow | null {
    return this.loginWindow;
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * 获取当前活动窗口
   */
  getActiveWindow(): BrowserWindow | null {
    return this.mainWindow || this.loginWindow;
  }

  // ============ Private Methods ============

  /**
   * 加载窗口内容
   */
  private loadWindowContent(window: BrowserWindow, route: string): void {
    if (this.config.isDev) {
      // 开发模式：加载 Vite dev server
      // 注意：HashRouter 使用 #/path 格式
      const hash = route === '/' ? '' : `#${route}`;
      const url = `${this.config.devServerUrl}${hash}`;
      logger.debug('Loading dev URL', { url, route });
      void window.loadURL(url).catch((error) => {
        logger.error('Failed to load dev URL', { route, url, error });
      });
    } else {
      // 生产模式：加载打包的 HTML
      const htmlPath = path.join(__dirname, '../../renderer/index.html');
      if (route === '/') {
        void window.loadFile(htmlPath).catch((error) => {
          logger.error('Failed to load renderer HTML file', { route, htmlPath, error });
        });
      } else {
        // 注意：hash 参数会自动添加 #
        void window.loadFile(htmlPath, { hash: route }).catch((error) => {
          logger.error('Failed to load renderer HTML file with route', {
            route,
            htmlPath,
            error,
          });
        });
      }
    }
  }

  private attachWindowDiagnostics(window: BrowserWindow, windowType: WindowType): void {
    // window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    //   logger.error('Window failed to load content', {
    //     windowType,
    //     errorCode,
    //     errorDescription,
    //     validatedURL,
    //   });
    // });

    // window.webContents.on('render-process-gone', (_event, details) => {
    //   logger.error('Renderer process exited unexpectedly', {
    //     windowType,
    //     reason: details.reason,
    //     exitCode: details.exitCode,
    //   });
    // });

    // window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    //   logger.info('Renderer console message', {
    //     windowType,
    //     level,
    //     message,
    //     line,
    //     sourceId,
    //   });
    // });
  }

  private getWindowForSender(webContentsId?: number): BrowserWindow | null {
    if (typeof webContentsId === 'number') {
      const senderWindow = BrowserWindow.getAllWindows().find(
        (window) => window.webContents.id === webContentsId,
      );
      if (senderWindow) {
        return senderWindow;
      }
    }

    return this.getActiveWindow();
  }

  /**
   * 注册 IPC 处理器
   */
  private registerIpcHandlers(): void {
    // 登录成功 → 切换到主窗口
    ipcMain.handle('window:transition-to-main', async () => {
      logger.info('IPC window:transition-to-main received');
      await this.transitionToMainWindow();
      return { success: true };
    });

    // 登出 → 切换到登录窗口
    ipcMain.handle('window:transition-to-login', async () => {
      logger.info('IPC window:transition-to-login received');
      await this.transitionToLoginWindow();
      return { success: true };
    });

    // 获取当前窗口类型
    ipcMain.handle('window:get-type', (event) => {
      const webContents = event.sender;
      if (this.loginWindow?.webContents === webContents) {
        return 'login';
      }
      if (this.mainWindow?.webContents === webContents) {
        return 'main';
      }
      return 'unknown';
    });
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    logger.info('Cleaning up WindowManager');

    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.close();
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }

    this.loginWindow = null;
    this.mainWindow = null;
  }
}

/**
 * 获取 WindowManager 单例
 */
export function getWindowManager(config?: WindowManagerConfig): WindowManager {
  return WindowManager.getInstance(config);
}
