import type { IUserSettingRepository } from '../../domain-server/repositories/IUserSettingRepository';

/**
 * Setting 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 * 璐熻矗绠＄悊棰嗗煙鏈嶅姟鍜屼粨鍌ㄧ殑瀹炰緥Create鍜岀敓鍛藉懆锟?
 *
 * 閲囩敤鎳掑姞杞芥ā寮忥細
 * - 鍙湪棣栨璋冪敤鏃跺垱寤哄疄锟?
 * - 鍚庣画璋冪敤杩斿洖宸叉湁瀹炰緥锛堝崟渚嬶級
 *
 * 鏀寔娴嬭瘯鏇挎崲锟?
 * - 鍏佽娉ㄥ叆 Mock Repository鐢ㄤ簬鍗曞厓娴嬭瘯
 */
export class SettingContainer {
  private static instance: SettingContainer;
  private userSettingRepository?: IUserSettingRepository;

  private constructor() {}

  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      throw new Error('UserSettingRepository not registered in SettingContainer');
    }
    return this.userSettingRepository;
  }

  setUserSettingRepository(repository: IUserSettingRepository): void {
    this.userSettingRepository = repository;
  }

  reset(): void {
    this.userSettingRepository = undefined;
  }
}

