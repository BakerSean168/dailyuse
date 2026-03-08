/**
 * 图片资源导出
 *
 * 使用 Vite 的 `new URL()` 语法导出资源路径
 * 这样可以确保在开发和生产环境都能正确处理
 */

export const imageAssetPaths = {
  // Logos
  logo: './logos/DailyUse.svg',
  logo16: './logos/DailyUse-16.png',
  logo24: './logos/DailyUse-24.png',
  logo32: './logos/DailyUse-32.png',
  logo48: './logos/DailyUse-48.png',
  logo128: './logos/DailyUse-128.png',
  logo256: './logos/DailyUse-256.png',
  logoIco: './logos/DailyUse.ico',
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
export const logo128 = new URL(imageAssetPaths.logo128, import.meta.url).href;
export const logo256 = new URL(imageAssetPaths.logo256, import.meta.url).href;
export const logoIco = new URL(imageAssetPaths.logoIco, import.meta.url).href;

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
  png128: logo128,
  png256: logo256,
} as const;

// 导出类型
export type LogoSize = keyof typeof logos;
