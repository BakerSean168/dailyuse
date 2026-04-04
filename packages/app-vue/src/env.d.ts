/// <reference types="pinia-plugin-persistedstate" />
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

declare module '*.icns' {
  const src: string;
  export default src;
}
