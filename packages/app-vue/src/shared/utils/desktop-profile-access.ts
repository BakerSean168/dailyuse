import { ProfileAccessChannels, type DesktopAccessSnapshot } from '@memoflow/contracts/electron';
import { fromIpcResult, isOk, type IpcResult } from '@memoflow/contracts/result';
import type { DesktopAuthApi } from './desktop-auth-recovery';

export async function readDesktopAccessSnapshot(
  api?: DesktopAuthApi,
): Promise<DesktopAccessSnapshot | null> {
  if (!api?.invoke) return null;
  const response = (await api.invoke(ProfileAccessChannels.GET_SNAPSHOT)) as IpcResult<DesktopAccessSnapshot>;
  const result = fromIpcResult(response);
  return isOk(result) ? result.data : null;
}
