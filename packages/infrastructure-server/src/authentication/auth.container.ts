/**
 * Authentication Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?Authentication 妯″潡鐨?repository 瀹炰緥
 */

import type { 
  IAuthCredentialRepository, 
  IAuthSessionRepository 
} from '@dailyuse/domain-server/authentication';

/**
 * Authentication 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class AuthContainer {
  private static instance: AuthContainer;
  private credentialRepository: IAuthCredentialRepository | null = null;
  private sessionRepository: IAuthSessionRepository | null = null;

  private constructor() {}

  /**
   * 鑾峰彇瀹瑰櫒鍗曚緥
   */
  static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    AuthContainer.instance = new AuthContainer();
  }

  /**
   * 娉ㄥ唽 CredentialRepository
   */
  registerCredentialRepository(repository: IAuthCredentialRepository): this {
    this.credentialRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 SessionRepository
   */
  registerSessionRepository(repository: IAuthSessionRepository): this {
    this.sessionRepository = repository;
    return this;
  }

  /**
   * 鑾峰彇 CredentialRepository
   */
  getCredentialRepository(): IAuthCredentialRepository {
    if (!this.credentialRepository) {
      throw new Error('CredentialRepository not registered. Call registerCredentialRepository first.');
    }
    return this.credentialRepository;
  }

  /**
   * 鑾峰彇 SessionRepository
   */
  getSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      throw new Error('SessionRepository not registered. Call registerSessionRepository first.');
    }
    return this.sessionRepository;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡閰嶇疆
   */
  isConfigured(): boolean {
    return this.credentialRepository !== null && this.sessionRepository !== null;
  }

  /**
   * 娓呯┖鎵€鏈夋敞鍐岀殑渚濊禆
   */
  clear(): void {
    this.credentialRepository = null;
    this.sessionRepository = null;
  }
}
