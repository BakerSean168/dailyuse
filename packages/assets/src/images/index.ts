/**
 * 图片资源导出
 *
 * 使用 Vite 的 `new URL()` 语法导出资源路径
 * 这样可以确保在开发和生产环境都能正确处理
 */

export const imageAssetPaths = {
  // Logos
  logo: './logos/Memoflow.svg',
  logo16: './logos/Memoflow-16.png',
  logo24: './logos/Memoflow-24.png',
  logo32: './logos/Memoflow-32.png',
  logo48: './logos/Memoflow-48.png',
  logo64: './logos/Memoflow-64.png',
  logo72: './logos/Memoflow-72.png',
  logo96: './logos/Memoflow-96.png',
  logo128: './logos/Memoflow-128.png',
  logo180: './logos/Memoflow-180.png',
  logo192: './logos/Memoflow-192.png',
  logo256: './logos/Memoflow-256.png',
  logo512: './logos/Memoflow-512.png',
  logo1024: './logos/Memoflow-1024.png',
  logoIco: './logos/Memoflow.ico',
  logoIcns: './logos/Memoflow.icns',
  trayWin16: './logos/Memoflow-Tray-Windows-16.png',
  trayWin32: './logos/Memoflow-Tray-Windows-32.png',
  // Avatars
  defaultAvatar: './avatars/profile1.png',
} as const;

export type ImageAssetKey = keyof typeof imageAssetPaths;

// Logos
export const logo = new URL(imageAssetPaths.logo, import.meta.url).href;
export const logo16 = new URL(imageAssetPaths.logo16, import.meta.url).href;
export const logo24 = new URL(imageAssetPaths.logo24, import.meta.url).href;
export const logo32 = new URL(imageAssetPaths.logo32, import.meta.url).href;
export const logo48 = new URL(imageAssetPaths.logo48, import.meta.url).href;
export const logo64 = new URL(imageAssetPaths.logo64, import.meta.url).href;
export const logo72 = new URL(imageAssetPaths.logo72, import.meta.url).href;
export const logo96 = new URL(imageAssetPaths.logo96, import.meta.url).href;
export const logo128 = new URL(imageAssetPaths.logo128, import.meta.url).href;
export const logo180 = new URL(imageAssetPaths.logo180, import.meta.url).href;
export const logo192 = new URL(imageAssetPaths.logo192, import.meta.url).href;
export const logo256 = new URL(imageAssetPaths.logo256, import.meta.url).href;
export const logo512 = new URL(imageAssetPaths.logo512, import.meta.url).href;
export const logo1024 = new URL(imageAssetPaths.logo1024, import.meta.url).href;
export const logoIco = new URL(imageAssetPaths.logoIco, import.meta.url).href;
export const logoIcns = new URL(imageAssetPaths.logoIcns, import.meta.url).href;
export const trayWin16 = new URL(imageAssetPaths.trayWin16, import.meta.url).href;
export const trayWin32 = new URL(imageAssetPaths.trayWin32, import.meta.url).href;

// Avatars
export const defaultAvatar = new URL(imageAssetPaths.defaultAvatar, import.meta.url).href;

// 导出所有 logos 作为对象（可选）
export const logos = {
  svg: logo,
  ico: logoIco,
  png16: logo16,
  png24: logo24,
  png32: logo32,
  png48: logo48,
  png64: logo64,
  png72: logo72,
  png96: logo96,
  png128: logo128,
  png180: logo180,
  png192: logo192,
  png256: logo256,
  png512: logo512,
  png1024: logo1024,
  trayWin16,
  trayWin32,
} as const;

// 导出类型
export type LogoSize = keyof typeof logos;
