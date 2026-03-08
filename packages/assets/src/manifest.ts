import { audioAssetPaths } from './audio';
import { imageAssetPaths } from './images';

export const assetManifest = {
  images: imageAssetPaths,
  audio: audioAssetPaths,
} as const;

export type AssetManifest = typeof assetManifest;
export type AssetImageKey = keyof typeof assetManifest.images;
export type AssetAudioKey = keyof typeof assetManifest.audio;
