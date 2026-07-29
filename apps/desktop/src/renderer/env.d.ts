/// <reference types="vite/client" />
/// <reference types="pinia-plugin-persistedstate" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, any>;
  export default component;
}

declare module '*.icns' {
  const src: string;
  export default src;
}

import type { ElectronBridge } from '@memoflow/ipc-client';

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export {};
