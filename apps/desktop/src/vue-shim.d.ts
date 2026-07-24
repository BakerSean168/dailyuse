/**
 * Residual 1330: standalone Vue SFC shim for desktop typecheck.
 * Kept free of package imports so ambient `*.vue` resolution cannot fail when
 * other renderer ambient modules (env.d.ts) pull optional client types.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
