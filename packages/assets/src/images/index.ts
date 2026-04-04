/**
 * 图片资源导出
 *
 * 资源清单保留稳定相对路径，供 Electron 主进程按文件系统解析。
 * 浏览器/渲染进程导出使用静态 import，确保 Vite 生产构建会发射资源文件。
 */

import logoUrl from './logos/Memoflow.svg';
import logo16Url from './logos/Memoflow-16.png';
import logo24Url from './logos/Memoflow-24.png';
import logo32Url from './logos/Memoflow-32.png';
import logo48Url from './logos/Memoflow-48.png';
import logo64Url from './logos/Memoflow-64.png';
import logo72Url from './logos/Memoflow-72.png';
import logo96Url from './logos/Memoflow-96.png';
import logo128Url from './logos/Memoflow-128.png';
import logo180Url from './logos/Memoflow-180.png';
import logo192Url from './logos/Memoflow-192.png';
import logo256Url from './logos/Memoflow-256.png';
import logo512Url from './logos/Memoflow-512.png';
import logo1024Url from './logos/Memoflow-1024.png';
import logoIcoUrl from './logos/Memoflow.ico';
import logoIcnsUrl from './logos/Memoflow.icns';
import trayWin16Url from './logos/Memoflow-Tray-Windows-16.png';
import trayWin32Url from './logos/Memoflow-Tray-Windows-32.png';
import defaultAvatarUrl from './avatars/profile1.png';

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
export const logo = logoUrl;
export const logo16 = logo16Url;
export const logo24 = logo24Url;
export const logo32 = logo32Url;
export const logo48 = logo48Url;
export const logo64 = logo64Url;
export const logo72 = logo72Url;
export const logo96 = logo96Url;
export const logo128 = logo128Url;
export const logo180 = logo180Url;
export const logo192 = logo192Url;
export const logo256 = logo256Url;
export const logo512 = logo512Url;
export const logo1024 = logo1024Url;
export const logoIco = logoIcoUrl;
export const logoIcns = logoIcnsUrl;
export const trayWin16 = trayWin16Url;
export const trayWin32 = trayWin32Url;

// Avatars
export const defaultAvatar = defaultAvatarUrl;

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
