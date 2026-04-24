import {
  installCommonBrowserMocks,
  installVuePiniaTestHarness,
  registerFastTestHooks,
} from '@dailyuse/test-utils';
installVuePiniaTestHarness();
registerFastTestHooks();

installCommonBrowserMocks({
  silenceConsole: ['warn', 'error'],
});
