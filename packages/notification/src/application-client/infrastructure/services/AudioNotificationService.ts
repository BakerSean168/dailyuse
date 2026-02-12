/**
 * 音频通知服务
 * @description 管理通知音效播放
 */

// @ts-nocheck - Audio assets not yet configured
import { SoundType } from '../../application/types';
import type { SoundConfig } from '../../application/types';
import { publishNotificationError } from '../../application/events/notificationEvents';

// 从 @dailyuse/assets 导入音频资源
import {
  alertSound,
  defaultSound,
  errorSound,
  notificationSound,
  reminderSound,
  successSound,
} from '@dailyuse/assets/audio';

/**
 * 音频通知管理器
 */
export class AudioNotificationService {
  private audioElements = new Map<string, HTMLAudioElement>();
  private preloadedSounds = new Map<SoundType, HTMLAudioElement>();
  private globalVolume: number = 0.7;
  private enabled: boolean = true;
  private userInteracted: boolean = false;
  private pendingPlays: Array<{ config: SoundConfig; notificationId: string }> = [];

  constructor() {
    this.initializeDefaultSounds();
    this.setupUserInteractionDetection();
  }

  /**
   * 设置用户交互检测
   * 浏览器要求用户交互后才能自动播放音频
   */
  private setupUserInteractionDetection(): void {
    const enableAutoplay = () => {
      console.log('[AudioNotificationService] ✅ 检测到用户交互，启用音频自动播放');
      this.userInteracted = true;

      // 播放所有待处理的音频
      if (this.pendingPlays.length > 0) {
        console.log(`[AudioNotificationService] 播放 ${this.pendingPlays.length} 个待处理音效`);
        this.pendingPlays.forEach(({ config, notificationId }) => {
          this.play(config, notificationId).catch((err) => {
            console.error('[AudioNotificationService] 待处理音效播放失败:', err);
          });
        });
        this.pendingPlays = [];
      }

      // 移除事件监听器
      ['click', 'keydown', 'touchstart'].forEach((event) => {
        document.removeEventListener(event, enableAutoplay);
      });
    };

    // 监听用户交互事件
    ['click', 'keydown', 'touchstart'].forEach((event) => {
      document.addEventListener(event, enableAutoplay, { once: true });
    });
  }

  /**
   * 初始化默认音效
   * 使用 @dailyuse/assets 中的音频资源
   */
  private initializeDefaultSounds(): void {
    const defaultSounds: Array<{ type: SoundType; url: string }> = [
      { type: SoundType.DEFAULT, url: defaultSound },
      { type: SoundType.REMINDER, url: reminderSound },
      { type: SoundType.ALERT, url: alertSound },
      { type: SoundType.SUCCESS, url: successSound },
      { type: SoundType.ERROR, url: errorSound },
      { type: SoundType.NOTIFICATION, url: notificationSound },
    ];

    defaultSounds.forEach(({ type, url }) => {
      try {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = this.globalVolume;

        // 错误处理
        audio.onerror = () => {
          console.warn(`[AudioNotification] 无法加载音频: ${url}`);
          this.preloadedSounds.delete(type);
        };

        // 加载完成
        audio.oncanplaythrough = () => {};

        this.preloadedSounds.set(type, audio);
      } catch (error) {
        console.error(`[AudioNotification] 创建音频元素失败: ${type}`, error);
      }
    });
  }

  /**
   * 播放通知音效
   */
  async play(config: SoundConfig, notificationId: string): Promise<void> {
    console.log('[AudioNotificationService] 播放音效请求:', {
      notificationId,
      enabled: this.enabled,
      configEnabled: config.enabled,
      soundType: config.type,
      volume: config.volume,
      userInteracted: this.userInteracted,
    });

    if (!this.enabled || !config.enabled) {
      console.warn('[AudioNotificationService] 音效被禁用，跳过播放');
      return;
    }

    // 🔊 检查用户交互状态
    if (!this.userInteracted) {
      console.warn('[AudioNotificationService] ⚠️ 尚未检测到用户交互，将音效加入待播放队列');
      this.pendingPlays.push({ config, notificationId });
      console.log(
        `[AudioNotificationService] 📝 当前待播放队列: ${this.pendingPlays.length} 个音效`,
      );
      console.log('[AudioNotificationService] 💡 提示：请点击页面任意位置以启用音效播放');
      return;
    }

    try {
      let audio: HTMLAudioElement;

      // 获取音频元素
      if (config.type === SoundType.CUSTOM && config.customUrl) {
        console.log('[AudioNotificationService] 加载自定义音频:', config.customUrl);
        audio = await this.loadCustomSound(config.customUrl, notificationId);
      } else {
        const preloaded = this.preloadedSounds.get(config.type);
        if (!preloaded) {
          console.warn(`[AudioNotificationService] 音频不可用: ${config.type}`);
          console.log(
            '[AudioNotificationService] 已预加载的音频:',
            Array.from(this.preloadedSounds.keys()),
          );
          return;
        }
        console.log('[AudioNotificationService] 使用预加载音频:', config.type);
        audio = preloaded.cloneNode() as HTMLAudioElement;
      }

      // 应用配置
      this.applyAudioConfig(audio, config);

      // 播放音频
      console.log('[AudioNotificationService] 开始播放...');
      await this.playAudio(audio, notificationId);
      console.log('[AudioNotificationService] ✅ 播放完成');
    } catch (error) {
      // 🔍 特殊处理 NotAllowedError
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.warn('[AudioNotificationService] ⚠️ 浏览器阻止自动播放，加入待播放队列');
        this.userInteracted = false; // 重置交互状态
        this.pendingPlays.push({ config, notificationId });
        console.log('[AudioNotificationService] 💡 提示：请点击页面任意位置以启用音效播放');
        return;
      }

      console.error('[AudioNotificationService] ❌ 播放音效失败:', error);
      publishNotificationError(error as Error, 'audio_playback', notificationId, true);
    }
  }

  /**
   * 加载自定义音频
   */
  private async loadCustomSound(url: string, notificationId: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = 'auto';

      const timeout = setTimeout(() => {
        reject(new Error(`音频加载超时: ${url}`));
      }, 5000);

      audio.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve(audio);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`音频加载失败: ${url}`));
      };

      audio.load();
    });
  }

  /**
   * 应用音频配置
   */
  private applyAudioConfig(audio: HTMLAudioElement, config: SoundConfig): void {
    // 音量设置
    const volume = config.volume ?? this.globalVolume;
    audio.volume = Math.max(0, Math.min(1, volume));

    // 循环设置
    audio.loop = config.loop || false;

    // 播放时长限制
    if (config.duration && config.duration > 0 && !config.loop) {
      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime * 1000 >= config.duration!) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    }
  }

  /**
   * 播放音频
   */
  private async playAudio(audio: HTMLAudioElement, notificationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 保存引用用于停止播放
      this.audioElements.set(notificationId, audio);

      // 播放结束处理
      const cleanup = () => {
        this.audioElements.delete(notificationId);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
      };

      const onEnded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('音频播放失败'));
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      // 开始播放
      const playPromise = audio.play();

      if (playPromise) {
        playPromise
          .then(() => {
            console.log(`[AudioNotification] 音频播放开始: ${notificationId}`);
          })
          .catch((error) => {
            cleanup();
            reject(error);
          });
      }
    });
  }

  /**
   * 停止指定通知的音效
   */
  stop(notificationId: string): void {
    const audio = this.audioElements.get(notificationId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.audioElements.delete(notificationId);
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    this.audioElements.forEach((audio, id) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.audioElements.clear();
  }

  /**
   * 设置全局音量
   */
  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));

    // 更新预加载音频的音量
    this.preloadedSounds.forEach((audio) => {
      audio.volume = this.globalVolume;
    });

    // 更新正在播放的音频音量
    this.audioElements.forEach((audio) => {
      audio.volume = this.globalVolume;
    });
  }

  /**
   * 获取全局音量
   */
  getGlobalVolume(): number {
    return this.globalVolume;
  }

  /**
   * 启用音效
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用音效
   */
  disable(): void {
    this.enabled = false;
    this.stopAll();
  }

  /**
   * 检查音效是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 测试播放指定类型的音效
   */
  async testSound(type: SoundType): Promise<boolean> {
    try {
      const testConfig: SoundConfig = {
        enabled: true,
        type,
        volume: this.globalVolume,
      };

      await this.play(testConfig, `test-${Date.now()}`);
      return true;
    } catch (error) {
      console.error(`[AudioNotification] 测试音效失败: ${type}`, error);
      return false;
    }
  }

  /**
   * 预加载自定义音频
   */
  async preloadCustomSound(url: string, cacheKey?: string): Promise<boolean> {
    try {
      const audio = await this.loadCustomSound(url, 'preload');
      audio.volume = this.globalVolume;

      if (cacheKey) {
        // 如果提供缓存键，将其作为自定义音效缓存
        this.preloadedSounds.set(cacheKey as SoundType, audio);
      }

      console.log(`[AudioNotification] 自定义音频预加载完成: ${url}`);
      return true;
    } catch (error) {
      console.error(`[AudioNotification] 预加载自定义音频失败: ${url}`, error);
      return false;
    }
  }

  /**
   * 获取音频支持信息
   */
  getAudioSupportInfo(): {
    supported: boolean;
    formats: {
      mp3: boolean;
      wav: boolean;
      ogg: boolean;
      m4a: boolean;
    };
    features: {
      autoplay: boolean;
      volume: boolean;
      loop: boolean;
    };
  } {
    const audio = new Audio();

    const formats = {
      mp3: audio.canPlayType('audio/mpeg') !== '',
      wav: audio.canPlayType('audio/wav') !== '',
      ogg: audio.canPlayType('audio/ogg') !== '',
      m4a: audio.canPlayType('audio/mp4') !== '',
    };

    const features = {
      autoplay: true, // 现代浏览器通常需要用户交互
      volume: typeof audio.volume !== 'undefined',
      loop: typeof audio.loop !== 'undefined',
    };

    return {
      supported: 'Audio' in window,
      formats,
      features,
    };
  }

  /**
   * 获取当前播放统计
   */
  getPlaybackStats(): {
    activeSounds: number;
    preloadedSounds: number;
    globalVolume: number;
    enabled: boolean;
  } {
    return {
      activeSounds: this.audioElements.size,
      preloadedSounds: this.preloadedSounds.size,
      globalVolume: this.globalVolume,
      enabled: this.enabled,
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopAll();

    // 清理预加载的音频
    this.preloadedSounds.forEach((audio) => {
      audio.src = '';
    });
    this.preloadedSounds.clear();

    console.log('[AudioNotification] 音频服务已销毁');
  }
}
