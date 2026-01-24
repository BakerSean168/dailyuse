/**
 * Initialization Manager for Infrastructure Server
 * 鍩虹璁炬柦鏈嶅姟鍣ㄥ垵濮嬪寲绠＄悊锟?
 *
 * 鑱岃矗锟?
 * - 娉ㄥ唽鍩虹璁炬柦灞傜殑鍒濆鍖栦换锟?
 * - 绠＄悊搴旂敤鍚姩鍜屽叧闂祦锟?
 *
 * @module Shared/Initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

/**
 * 娉ㄥ唽鍩虹璁炬柦灞傜殑鎵€鏈夊垵濮嬪寲浠诲姟
 */
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  console.log('All infrastructure initialization tasks registered');
}

/**
 * 搴旂敤鍚姩鏃剁殑鍒濆锟?
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting infrastructure application initialization...');

  // 娉ㄥ唽鎵€鏈夊垵濮嬪寲浠诲姟
  registerAllInitializationTasks();

  // 鎵ц搴旂敤鍚姩闃舵鐨勫垵濮嬪寲
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);

  console.log('锟?Infrastructure application initialization completed');
}

/**
 * 搴旂敤鍏抽棴鏃剁殑娓呯悊
 */
export async function cleanupApp(): Promise<void> {
  console.log('Cleaning up infrastructure application...');

  const manager = InitializationManager.getInstance();
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);

  console.log('锟?Infrastructure application cleanup completed');
}

/**
 * 妫€鏌ョ壒瀹氫换鍔℃槸鍚﹀凡瀹屾垚
 */
export function isTaskCompleted(taskName: string): boolean {
  const manager = InitializationManager.getInstance();
  return manager.isTaskCompleted(taskName);
}
