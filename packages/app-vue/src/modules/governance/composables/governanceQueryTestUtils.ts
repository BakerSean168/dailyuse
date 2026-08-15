/**
 * Shared mount helpers for Governance Query Cache composable specs.
 *
 * Provides a deterministic test QueryClient (via VueQueryPlugin), a test server-state
 * runtime, a fake Governance service, and an identity-scope resolver.
 */

import { defineComponent, h, type DefineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import {
  createTestServerStateRuntime,
  SERVER_STATE_IDENTITY_SCOPE_KEY,
  SERVER_STATE_RUNTIME_KEY,
  type ServerStateRuntime,
} from '../../../platform/server-state';
import { RULE_SERVICE_KEY } from '../../../di/keys';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      errors: {
        VALIDATION_ERROR: 'Please check your input',
        unknown: 'Unexpected error',
      },
      governance: {
        error: {
          loadListFailed: 'Failed to load governance rules',
          loadRuleFailed: 'Failed to load rule',
          loadRevisionFailed: 'Failed to load revisions',
          createRuleFailed: 'Failed to create rule',
          updateRuleFailed: 'Failed to update rule',
          deleteRuleFailed: 'Failed to delete rule',
        },
      },
    },
  },
});

export interface MountGovernanceComposableOptions {
  service: Record<string, unknown>;
  runtime?: ServerStateRuntime;
  identityScope?: string;
}

export function mountGovernanceComposable<T>(
  factory: () => T,
  options: MountGovernanceComposableOptions,
): { api: T; runtime: ServerStateRuntime } {
  let api!: T;
  const runtime = options.runtime ?? createTestServerStateRuntime();
  const pinia = createPinia();
  setActivePinia(pinia);

  const Host = defineComponent({
    setup() {
      api = factory();
      return () => h('div');
    },
  }) as DefineComponent<object, object, object>;

  mount(Host, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: runtime.queryClient }], pinia, i18n],
      provide: {
        [RULE_SERVICE_KEY as symbol]: options.service,
        [SERVER_STATE_RUNTIME_KEY]: runtime,
        [SERVER_STATE_IDENTITY_SCOPE_KEY]: () => options.identityScope ?? 'identity-1',
      },
    },
  });

  return { api, runtime };
}

export { i18n };
