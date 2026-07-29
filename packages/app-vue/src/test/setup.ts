import {
  installCommonBrowserMocks,
  installVuePiniaTestHarness,
  registerFastTestHooks,
} from '@memoflow/test-utils';

installVuePiniaTestHarness();
registerFastTestHooks({
  timezone: false,
});
installCommonBrowserMocks();
