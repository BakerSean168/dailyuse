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

interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
