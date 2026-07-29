import {
  installCommonBrowserMocks,
  installVuePiniaTestHarness,
  registerFastTestHooks,
} from '@memoflow/test-utils';
installVuePiniaTestHarness();
registerFastTestHooks();

installCommonBrowserMocks({
  silenceConsole: ['warn', 'error'],
});
