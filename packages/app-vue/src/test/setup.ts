import {
  installCommonBrowserMocks,
  installVuePiniaTestHarness,
  registerFastTestHooks,
} from '@dailyuse/test-utils';

installVuePiniaTestHarness();
registerFastTestHooks({
  timezone: false,
});
installCommonBrowserMocks();
