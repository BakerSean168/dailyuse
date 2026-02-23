/**
 * AppConfig Client DTO
 *
 * Desktop/Electron 应用级本地配置。
 * 与 UserSetting（用户偏好设置）不同，AppConfig 管理的是应用窗口状态等本地运行时配置。
 */

export interface AppConfigClientDTO {
  /** 窗口位置与大小 */
  windowBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  /** 最后打开的仓库路径 */
  lastOpenedRepository: string | null;
  /** 本地数据存储路径 */
  localDataPath: string;
  /** 侧栏是否收起 */
  sidebarCollapsed: boolean;
}
