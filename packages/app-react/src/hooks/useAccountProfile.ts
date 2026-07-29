import { useEffect, useState } from 'react';

import type { AccountClientDTO } from '@memoflow/contracts/account';

import { useAppSession } from './useAppSession';
import { useAccountService } from './useAccountService';

export function useAccountProfile() {
  const service = useAccountService();
  const { isRemoteAuthenticated } = useAppSession();
  const [account, setAccount] = useState<AccountClientDTO | null>(null);
  const [isLoading, setIsLoading] = useState(isRemoteAuthenticated);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isRemoteAuthenticated) {
      setAccount(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await service.getMyProfile();
    if (!result.ok) {
      setAccount(null);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setAccount(result.data.toDTO());
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [isRemoteAuthenticated]);

  async function refresh() {
    await load();
  }

  return {
    account,
    error,
    isLoading,
    isRemoteAuthenticated,
    refresh,
  };
}
