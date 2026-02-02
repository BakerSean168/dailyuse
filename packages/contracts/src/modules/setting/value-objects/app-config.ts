export interface AppConfig {
  // 窗口状态
  windowBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
    // 最后打开的仓库
    lastOpenedRepository: string | null;
    // 本地存储路径
    localDataPath: string;
    // UI 状态
    sidebarCollapsed: boolean;
}