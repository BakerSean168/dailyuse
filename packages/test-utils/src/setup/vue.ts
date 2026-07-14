import { config, mount } from '@vue/test-utils';
import type { Component, Plugin } from 'vue';
import type { ComponentMountingOptions } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';

export function createTestPinia(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

export function installVuePiniaTestHarness(): Pinia {
  const pinia = createTestPinia();
  const existingPlugins = (config.global.plugins ?? []) as Plugin[];
  config.global.plugins = [pinia, ...existingPlugins];
  return pinia;
}

export function mountWithPinia<T extends Component>(
  component: T,
  options?: ComponentMountingOptions<T>,
): any {
  const pinia = createTestPinia();
  const existingPlugins = (options?.global?.plugins ?? []) as Plugin[];

  return mount(component, {
    ...(options ?? {}),
    global: {
      ...(options?.global ?? {}),
      plugins: [pinia, ...existingPlugins],
    },
  });
}
