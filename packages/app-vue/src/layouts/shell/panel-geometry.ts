/**
 * 业务面板几何纯函数（2026-07-14 壳层诊断修订 §6）
 *
 * 动态约束：任意合法 split 下 AI 列 >= CHAT_MIN，业务面板 >= PANEL_MIN。
 * 固定 320–750 已退役；上限由视口、侧栏和 AI 最小宽度共同决定。
 */

export const PANEL_MIN = 360;
export const PANEL_MAX_CAP = 760;
export const CHAT_MIN = 420;
export const PANEL_DEFAULT_RATIO = 0.48;
export const PANEL_DEFAULT_FLOOR = 420;

/** Global Composer 宿主几何（§8.4）。 */
export const COMPOSER_MAX = 740;
export const COMPOSER_SIDE_GAP = 28;
export const COMPOSER_BOTTOM_GAP = 24;
/** textarea 自动增高上限（约 5–6 行）。 */
export const COMPOSER_TEXTAREA_MAX_PX = 168;
/** split 下 AI 列宽低于此值时仅显示图标控件。 */
export const COMPOSER_ICON_DENSITY_MAX = 480;
/** split 下 AI 列宽低于此值时使用紧凑控件。 */
export const COMPOSER_COMPACT_DENSITY_MAX = 640;

export type ComposerDensity = 'comfortable' | 'compact' | 'icon';
export type ComposerLayoutMode = 'inline' | 'floating';

export interface PanelGeometryInput {
  viewportWidth: number;
  /** 侧栏实际占用宽度；折叠或隐藏时为 0。 */
  sidebarOccupiedWidth: number;
  /** 用户偏好的面板宽度（可能越界，调用方负责 clamp）。 */
  preferredPanelWidth?: number;
}

export interface PanelGeometry {
  workspaceWidth: number;
  panelMin: number;
  panelMax: number;
  /** 当前偏好宽度经 clamp 后的有效宽度。 */
  panelWidth: number;
  /** 默认推荐宽度（未持久化偏好时使用）。 */
  defaultPanelWidth: number;
  /** 分栏是否几何上可行；false 时应使用 viewport focus。 */
  canSplit: boolean;
  /** AI 列剩余宽度（split 下）。 */
  aiWidth: number;
}

export interface ComposerLayout {
  width: number;
  left: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

/** 计算当前视口下的业务面板可用宽度区间与默认值。 */
export function computePanelGeometry(input: PanelGeometryInput): PanelGeometry {
  const viewportWidth = Math.max(0, Math.floor(input.viewportWidth));
  const sidebarOccupiedWidth = Math.max(0, Math.floor(input.sidebarOccupiedWidth));
  const workspaceWidth = Math.max(0, viewportWidth - sidebarOccupiedWidth);
  const panelMax = Math.max(0, Math.min(PANEL_MAX_CAP, workspaceWidth - CHAT_MIN));
  const canSplit = panelMax >= PANEL_MIN;
  const effectiveMax = canSplit ? panelMax : PANEL_MIN;
  const defaultPanelWidth = canSplit
    ? clamp(Math.round(workspaceWidth * PANEL_DEFAULT_RATIO), PANEL_DEFAULT_FLOOR, effectiveMax)
    : PANEL_MIN;

  const preferred =
    typeof input.preferredPanelWidth === 'number' && Number.isFinite(input.preferredPanelWidth)
      ? input.preferredPanelWidth
      : defaultPanelWidth;

  const panelWidth = canSplit ? clamp(Math.round(preferred), PANEL_MIN, effectiveMax) : PANEL_MIN;
  const aiWidth = Math.max(0, workspaceWidth - panelWidth);

  return {
    workspaceWidth,
    panelMin: PANEL_MIN,
    panelMax: effectiveMax,
    panelWidth,
    defaultPanelWidth,
    canSplit,
    aiWidth,
  };
}

/** 拖拽过程中按指针位置计算面板宽度（面板贴右边缘）。 */
export function panelWidthFromPointer(
  clientX: number,
  viewportWidth: number,
  sidebarOccupiedWidth: number,
): number {
  const geometry = computePanelGeometry({ viewportWidth, sidebarOccupiedWidth });
  if (!geometry.canSplit) return geometry.panelWidth;
  const raw = viewportWidth - clientX;
  return clamp(Math.round(raw), geometry.panelMin, geometry.panelMax);
}

/**
 * 按宿主矩形计算 Composer 宽度与相对宿主的 left。
 * 宿主是 AI 列（A/B）或业务工作区（C），不是整窗。
 */
export function computeComposerLayout(
  hostWidth: number,
  hostLeft = 0,
  maxWidth = COMPOSER_MAX,
  sideGap = COMPOSER_SIDE_GAP,
): ComposerLayout {
  const safeHostWidth = Math.max(0, Math.floor(hostWidth));
  const width = Math.min(maxWidth, Math.max(0, safeHostWidth - 2 * sideGap));
  const left = hostLeft + (safeHostWidth - width) / 2;
  return { width, left };
}

/** 根据壳态与宿主宽度推导 Composer 控件密度。 */
export function resolveComposerDensity(
  hostWidth: number,
  mode: ComposerLayoutMode,
): ComposerDensity {
  if (mode === 'floating') return 'compact';
  if (hostWidth < COMPOSER_ICON_DENSITY_MAX) return 'icon';
  if (hostWidth < COMPOSER_COMPACT_DENSITY_MAX) return 'compact';
  return 'comfortable';
}
